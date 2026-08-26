import { SettingsLayout } from '../SettingsLayout'

export const DangerZoneSettingsPage = () => {
  return (
    <SettingsLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h2>⚠️ Danger Zone</h2>
          <p>Irreversible administrative actions</p>
        </div>

        <div className="settings-section danger-zone">
          <div className="danger-action">
            <div className="danger-info">
              <h3>Archive Academic Year</h3>
              <p>Move an academic year to archived status. This cannot be undone.</p>
            </div>
            <button className="btn btn-danger">Archive Year</button>
          </div>

          <div className="danger-action">
            <div className="danger-info">
              <h3>Reset School Data</h3>
              <p>Delete all school configuration. All students, teachers, and tests will be deleted.</p>
            </div>
            <button className="btn btn-danger">Reset School</button>
          </div>

          <div className="danger-action">
            <div className="danger-info">
              <h3>Delete Account</h3>
              <p>Permanently delete your admin account and all associated data.</p>
            </div>
            <button className="btn btn-danger">Delete Account</button>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
