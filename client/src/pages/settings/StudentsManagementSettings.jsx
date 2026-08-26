import { useState, useEffect } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'

export const StudentsManagementSettings = () => {
  const { data, loading, error } = useSettings('users/students')
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (data?.items) {
      setStudents(data.items)
      setTotal(data.total)
    }
  }, [data])

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>Student Management</h2>
          <p>Manage student records and enrollment</p>
        </div>

        <div className="settings-section">
          <div className="section-controls">
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button className="btn btn-primary">+ Add Student</button>
            <button className="btn btn-secondary">Import Students</button>
          </div>

          {loading && <div className="loader">Loading...</div>}
          {error && <div className="error">{error}</div>}

          <table className="settings-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Enrollment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-message">No students found</td>
                </tr>
              )}
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm">Edit</button>
                    <button className="btn btn-sm btn-secondary">Suspend</button>
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
