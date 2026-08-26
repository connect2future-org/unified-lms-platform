import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SettingsSidebar } from '../components/settings/SettingsSidebar'
import '../styles/SettingsLayout.css'

export const SettingsLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="settings-container">
      <SettingsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="settings-main">
        <div className="settings-header">
          <button
            className="settings-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle settings menu"
          >
            ☰
          </button>
          <div className="settings-title-area">
            <h1 className="settings-page-title">Settings</h1>
          </div>
        </div>

        <div className="settings-content">
          {children}
        </div>
      </main>
    </div>
  )
}
