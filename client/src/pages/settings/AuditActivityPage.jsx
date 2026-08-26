import { useState } from 'react'
import { SettingsLayout } from '../SettingsLayout'
import { useSettings } from '../../hooks/useSettings'

export const AuditActivityPage = () => {
  const { data, loading } = useSettings('audit')
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: ''
  })
  const [logs, setLogs] = useState([])

  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>Audit Activity Log</h2>
          <p>Track all system changes and administrative actions</p>
        </div>

        <div className="settings-section">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Filter by action type..."
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="search-input"
            />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
            <button className="btn btn-primary">Filter</button>
          </div>

          {loading && <div className="loader">Loading audit logs...</div>}

          <table className="settings-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
                <th>Timestamp</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-message">No audit logs found</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>{log.user?.name}</td>
                  <td><span className="badge">{log.action}</span></td>
                  <td>{log.entityType}</td>
                  <td>{log.description}</td>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsLayout>
  )
}
