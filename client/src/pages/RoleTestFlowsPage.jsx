import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'

const roleFlows = [
  {
    title: 'Student',
    createTo: '/signup?role=candidate',
    loginTo: '/login?role=student',
    api: '/api/auth/signup, /api/auth/login, /api/tests, /api/attempts',
  },
  {
    title: 'Team',
    createTo: '/register-team',
    loginTo: '/login?role=team',
    api: '/api/teams/register, /api/auth/team/login, /api/auth/team/me',
  },
  {
    title: 'Admin',
    createTo: '/signup?role=admin',
    loginTo: '/login?role=admin',
    api: '/api/auth/signup, /api/auth/login, /api/teams/admin',
  },
]

export function RoleTestFlowsPage() {
  return (
    <PageShell>
      <section className="rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl md:p-12">
        <h1 className="text-3xl font-black text-slate-900 md:text-4xl">Role Test Flows</h1>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Quick access for end-to-end checks
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {roleFlows.map((flow) => (
            <div key={flow.title} className="rounded-2xl border border-slate-300 bg-white/70 p-5 shadow-sm">
              <h2 className="text-base font-black text-slate-900">{flow.title}</h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={flow.createTo}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Create Account
                </Link>
                <Link
                  to={flow.loginTo}
                  className="rounded-lg border border-slate-400 px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  Login Flow
                </Link>
              </div>

              <p className="mt-3 text-xs text-slate-600">API: {flow.api}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
