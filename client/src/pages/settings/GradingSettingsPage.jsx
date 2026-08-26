import { useState } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'

export const GradingSettingsPage = () => {
  const [form, setForm] = useState({
    grades: [
      { name: 'A+', minPercentage: 90, maxPercentage: 100 },
      { name: 'A', minPercentage: 80, maxPercentage: 89 },
      { name: 'B', minPercentage: 70, maxPercentage: 79 },
      { name: 'C', minPercentage: 60, maxPercentage: 69 },
      { name: 'D', minPercentage: 50, maxPercentage: 59 },
      { name: 'F', minPercentage: 0, maxPercentage: 49 }
    ],
    passingPercentage: 35,
    failingGrade: 'F'
  })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('Grading configuration saved successfully')
  }

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>Grading Configuration</h2>
          <p>Define grade scales and passing criteria</p>
        </div>

        {message && <div className={`message success`}>{message}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="settings-section">
            <h3>Grade Scale</h3>
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Min %</th>
                  <th>Max %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {form.grades.map((grade, idx) => (
                  <tr key={idx}>
                    <td><input type="text" value={grade.name} readOnly /></td>
                    <td><input type="number" value={grade.minPercentage} min="0" max="100" /></td>
                    <td><input type="number" value={grade.maxPercentage} min="0" max="100" /></td>
                    <td><button type="button" className="btn btn-sm">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="settings-section">
            <h3>Passing Criteria</h3>
            <label>
              Minimum Passing Percentage
              <input
                type="number"
                value={form.passingPercentage}
                onChange={(e) => setForm({ ...form, passingPercentage: e.target.value })}
                min="0"
                max="100"
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save Grading Configuration</button>
          </div>
        </form>
      </div>
    </SettingsLayout>
  )
}
