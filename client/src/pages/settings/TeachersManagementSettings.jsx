import { useState, useEffect } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'

export const TeachersManagementSettings = () => {
  const { data, loading, error } = useSettings('users/teachers')
  const [teachers, setTeachers] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (data?.items) {
      setTeachers(data.items)
    }
  }, [data])

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>Teacher Management</h2>
          <p>Manage teacher profiles and assignments</p>
        </div>

        <div className="settings-section">
          <div className="section-controls">
            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button className="btn btn-primary">+ Add Teacher</button>
            <button className="btn btn-secondary">Import Teachers</button>
          </div>

          {loading && <div className="loader">Loading...</div>}

          <table className="settings-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>School</th>
                <th>Subjects</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-message">No teachers found</td>
                </tr>
              )}
              {teachers.map((teacher) => (
                <tr key={teacher._id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.schoolId ? 'Assigned' : 'Unassigned'}</td>
                  <td>-</td>
                  <td>
                    <button className="btn btn-sm">Edit</button>
                    <button className="btn btn-sm">Assign Classes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsLayout>
  )
}
