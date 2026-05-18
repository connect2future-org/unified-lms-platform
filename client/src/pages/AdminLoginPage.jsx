import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { loginAdmin } from '../services/api'
import { useAuth } from '../context/AuthContext'

export function AdminLoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from || '/admin/teams'

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await loginAdmin({ username, password })
      if (result?.token) {
        login({
          token: result.token,
          user: result?.user || {
            role: 'admin',
            name: result?.admin?.username || username,
            authType: 'platform-admin'
          }
        })
      }
      navigate(redirectTo, { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-md rounded-3xl border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <h1 className="text-3xl font-black text-slate-900">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-700">
          Authenticate as admin to manage team operations and project assignments.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-300/40 bg-rose-900/30 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-800">
              Username
            </label>
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              placeholder="Enter admin username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-800">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-slate-900 placeholder:text-slate-500"
              placeholder="Enter admin password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:text-blue-100"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </section>
    </PageShell>
  )
}
