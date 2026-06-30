import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const isTestTakingRoute = Boolean(useMatch('/candidate/tests/:testId'))
  const isAdminUser = isAuthenticated && user?.role === 'admin'
  const displayName = useMemo(() => user?.name || user?.email || 'User', [user])
  const roleLabel = useMemo(() => {
    if (user?.role === 'super-admin') {
      return 'Super Admin'
    }
    if (user?.role === 'admin') {
      return 'Admin'
    }
    if (user?.role === 'team') {
      return 'Team'
    }
    if (user?.role === 'candidate') {
      return 'Candidate'
    }
    return 'User'
  }, [user])
  const shortName = useMemo(() => {
    return displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [displayName])

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const rolePath = user?.role === 'admin' && user?.authType === 'platform-admin'
    ? '/admin/teams'
    : roleHome[user?.role] || '/'

  const menuItems = useMemo(() => {
    if (user?.role === 'super-admin') {
      return [
        { label: 'Super Admin Dashboard', path: '/super-admin' },
        { label: 'Student Insights (Coming Soon)', disabled: true },
        { label: 'Platform Settings (Coming Soon)', disabled: true }
      ]
    }

    if (user?.role === 'admin') {
      return [
        { label: 'Admin Dashboard', path: '/admin' },
        { label: 'Team Management', path: '/admin/teams' },
        { label: 'Reports (Coming Soon)', disabled: true }
      ]
    }

    if (user?.role === 'team') {
      return [
        { label: 'Team Dashboard', path: '/team/dashboard' },
        { label: 'Profile & Members (Coming Soon)', disabled: true },
        { label: 'Progress Tracker (Coming Soon)', disabled: true }
      ]
    }

    return [
      { label: 'Candidate Dashboard', path: '/candidate' },
      { label: 'My Profile (Coming Soon)', disabled: true },
      { label: 'Notifications (Coming Soon)', disabled: true }
    ]
  }, [user])

  const handleMenuNavigate = (path) => {
    if (!path) {
      return
    }
    setProfileOpen(false)
    navigate(path)
  }

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
        <NavLink to="/login" className="nav-link-chip">
          Login
        </NavLink>

        {isAuthenticated ? (
          <div className="nav-profile" ref={profileRef}>
            <button
              type="button"
              className="nav-profile-trigger"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <span className="nav-avatar">{shortName || 'US'}</span>
              <span className="nav-profile-name">{displayName}</span>
              <span className="nav-profile-caret">▾</span>
            </button>

            {profileOpen ? (
              <div className="nav-profile-menu">
                <p className="nav-profile-title">Signed in as</p>
                <p className="nav-profile-value">{displayName}</p>
                <p className="nav-profile-sub">Role: {roleLabel}</p>

                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="nav-menu-item"
                    disabled={Boolean(item.disabled)}
                    onClick={() => handleMenuNavigate(item.path)}
                  >
                    {item.label}
                  </button>
                ))}
                <button type="button" className="nav-menu-item danger" onClick={onLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <NavLink to="/login" className="nav-link-chip">
            Login
          </NavLink>
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
