import { NavLink, useMatch, useNavigate } from 'react-router-dom'
import { AppRouter } from './app/router/AppRouter'
import { useAuth } from './context/AuthContext'

const roleHome = {
  team: '/team/dashboard',
  candidate: '/candidate',
  admin: '/admin',
  'super-admin': '/super-admin'
}

function TopNav() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const isTestTakingRoute = Boolean(useMatch('/candidate/tests/:testId'))
  const isAdminUser = isAuthenticated && user?.role === 'admin'

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const rolePath = user?.role === 'admin' && user?.authType === 'platform-admin'
    ? '/admin/teams'
    : roleHome[user?.role] || '/'

  if (isTestTakingRoute) {
    return null
  }

  return (
    <header className="top-nav">
      <div className="brand">PES LMS Platform</div>
      <nav>
        <NavLink to="/landing" className="nav-link-chip">
          Home
        </NavLink>
        {isAdminUser ? (
          <>
            <NavLink to="/admin" className="nav-link-chip">
              Tests
            </NavLink>
            <NavLink to="/admin/teams" className="nav-link-chip">
              Team Management
            </NavLink>
          </>
        ) : null}
        <NavLink to="/register-team" className="nav-link-chip">
          Team Register
        </NavLink>
        <NavLink to="/team/login" className="nav-link-chip">
          Team Login
        </NavLink>

        {isAuthenticated ? (
          <>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link-chip">
              Candidate Login
            </NavLink>
            <NavLink to="/signup" className="nav-link-chip">
              Signup
            </NavLink>
          </>
        )}
      </nav>
    </header>
  )
}

function App() {
  return (
    <div className="app-root">
      <TopNav />
      <main className="app-main">
        <AppRouter />
      </main>
    </div>
  )
}

export default App
