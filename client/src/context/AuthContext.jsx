import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import {
  clearAdminToken,
  clearTeamSession,
  clearUserToken,
  getAdminMe,
  getAdminToken,
  getTeamMe,
  getTeamToken,
  getUserToken,
  setAdminToken,
  setTeamSession,
  setUserToken
} from '../services/api'

const AuthContext = createContext(null)

const mapTeamUser = (team) => ({
  id: team?.id,
  name: team?.teamName || team?.leadName || 'Team',
  role: 'team',
  team
})

const mapPlatformAdminUser = (admin) => ({
  id: admin?.username || 'platform-admin',
  name: admin?.username || 'Admin',
  role: 'admin',
  authType: 'platform-admin'
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const hydrateAuth = async () => {
      try {
        const userToken = getUserToken()
        if (userToken) {
          const data = await authService.me()
          if (!cancelled) {
            setUser(data.user || null)
          }
          return
        }

        const adminToken = getAdminToken()
        if (adminToken) {
          const data = await getAdminMe()
          const adminUser = data?.user || (data?.admin ? mapPlatformAdminUser(data.admin) : null)
          if (!cancelled) {
            setUser(adminUser)
          }
          return
        }

        const teamToken = getTeamToken()
        if (teamToken) {
          const data = await getTeamMe(teamToken)
          if (!cancelled) {
            setUser(mapTeamUser(data?.team))
          }
          return
        }

        if (!cancelled) {
          setUser(null)
        }
      } catch {
        if (!cancelled) {
          clearUserToken()
          clearTeamSession()
          clearAdminToken()
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    hydrateAuth()

    return () => {
      cancelled = true
    }
  }, [])

  const login = ({ token, user: nextUser }) => {
    if (!token) {
      return
    }

    const role = nextUser?.role

    if (role === 'team') {
      setTeamSession({ token, team: nextUser?.team || nextUser })
      clearUserToken()
      clearAdminToken()
      setUser(mapTeamUser(nextUser?.team || nextUser))
      return
    }

    if (role === 'admin' && nextUser?.authType === 'platform-admin') {
      setAdminToken(token)
      clearUserToken()
      clearTeamSession()
      setUser(nextUser)
      return
    }

    setUserToken(token)
    clearAdminToken()
    clearTeamSession()
    setUser(nextUser || null)
  }

  const logout = () => {
    clearUserToken()
    clearTeamSession()
    clearAdminToken()
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
