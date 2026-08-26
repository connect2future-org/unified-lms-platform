import { useState, useEffect } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'

export const AcademicYearsSettings = () => {
  const { data, loading, error, create } = useSettings('academic')
  const [years, setYears] = useState([])
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await create(form)
      setForm({ name: '', startDate: '', endDate: '', isCurrent: false })
      setMessage('Academic year created successfully')
    } catch (err) {
      setMessage('Failed to create academic year')
    }
  }

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>Academic Years & Terms</h2>
          <p>Manage academic years and terms</p>
        </div>

        {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

        <div className="settings-section">
          <h3>Create New Academic Year</h3>
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-section">
              <label>
                Year Name (e.g., 2024-2025)
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="2024-2025"
                  required
                />
              </label>

              <label>
                Start Date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </label>

              <label>
                End Date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isCurrent}
                  onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
                />
                Mark as Current Academic Year
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Create Academic Year
              </button>
            </div>
          </form>
        </div>

        <div className="settings-section">
          <h3>Existing Academic Years</h3>
          <table className="settings-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {years.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-message">No academic years configured</td>
                </tr>
              )}
              {years.map((year) => (
                <tr key={year._id}>
                  <td>{year.name}</td>
                  <td>{new Date(year.startDate).toLocaleDateString()}</td>
                  <td>{new Date(year.endDate).toLocaleDateString()}</td>
                  <td>{year.isCurrent ? 'Current' : 'Inactive'}</td>
                  <td><button className="btn btn-sm">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsLayout>
  )
}
