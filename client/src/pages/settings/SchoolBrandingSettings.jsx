import { useState, useEffect } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'

export const SchoolBrandingSettings = () => {
  const { data, loading, error, update } = useSettings('school')
  const [form, setForm] = useState({
    logo: '',
    favicon: '',
    primaryColor: '#0969da',
    secondaryColor: '#6e40aa'
  })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await update(form._id, form)
      setMessage('Branding updated successfully')
    } catch (err) {
      setMessage('Failed to update branding')
    }
  }

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>School Branding</h2>
          <p>Customize your school's visual identity</p>
        </div>

        {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <label>
              Logo URL
              <input
                type="url"
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
              />
            </label>

            <label>
              Favicon URL
              <input
                type="url"
                value={form.favicon}
                onChange={(e) => setForm({ ...form, favicon: e.target.value })}
              />
            </label>

            <label>
              Primary Color
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              />
            </label>

            <label>
              Secondary Color
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </form>
      </div>
    </SettingsLayout>
  )
}
