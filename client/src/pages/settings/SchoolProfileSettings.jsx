import { useState, useEffect } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'

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
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (data?.items?.[0]) {
      setForm(data.items[0])
    }
  }, [data])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await update(form._id, form)
      setMessage('School profile updated successfully')
    } catch (err) {
      setMessage('Failed to update school profile')
    }
  }

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>School Profile</h2>
          <p>Configure your school's basic information</p>
        </div>

        {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

        {loading && <div className="loader">Loading...</div>}
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <label>
              School Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label>
              School ID / Code
              <input
                type="text"
                value={form.schoolId}
                onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                required
              />
            </label>

            <label>
              Address
              <textarea
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <label>
              Contact Number
              <input
                type="tel"
                value={form.contact || ''}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </label>

            <label>
              Website
              <input
                type="url"
                value={form.website || ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </label>

            <label>
              Principal Name
              <input
                type="text"
                value={form.principal || ''}
                onChange={(e) => setForm({ ...form, principal: e.target.value })}
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </SettingsLayout>
  )
}
