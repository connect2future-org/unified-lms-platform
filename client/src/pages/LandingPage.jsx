import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'

export function LandingPage() {
  return (
    <PageShell>
      <section className="rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl md:p-12">
        <p className="mb-3 inline-flex rounded-full border border-blue-400 bg-blue-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-900">
          Hackathon Registration Portal
        </p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-900 md:text-5xl">
          Register your team and get an instantly allocated innovation project.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-700 md:text-lg">
          Built for local network events. Teams register quickly, receive project
          statements instantly, and faculty can monitor live activity in the
          dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register-team"
            className="rounded-xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-200"
          >
            Start Team Registration
          </Link>
          <Link
            to="/login?role=team"
            className="rounded-xl border border-blue-400 bg-blue-50 px-6 py-3 text-sm font-black text-blue-900 transition hover:bg-blue-100"
          >
            Team Login
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl border border-slate-400 bg-slate-100 px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-200"
          >
            View Live Dashboard
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-300/70 bg-white/50 p-5">
          <h2 className="text-lg font-black text-slate-900">Role Test Flows</h2>
          <p className="mt-1 text-sm text-slate-700">
            Use these buttons to create accounts and test complete flows for Student, Team, and Admin.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-300/80 bg-slate-50 p-4">
              <h3 className="text-sm font-black text-slate-900">Student</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/signup?role=candidate" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                  Create Account
                </Link>
                <Link to="/login?role=student" className="rounded-lg border border-slate-400 px-3 py-1.5 text-xs font-bold text-slate-800">
                  Login Flow
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-600">API: /api/auth/signup, /api/auth/login, /api/tests, /api/attempts</p>
            </div>

            <div className="rounded-xl border border-slate-300/80 bg-slate-50 p-4">
              <h3 className="text-sm font-black text-slate-900">Team</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/register-team" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                  Create Account
                </Link>
                <Link to="/login?role=team" className="rounded-lg border border-slate-400 px-3 py-1.5 text-xs font-bold text-slate-800">
                  Login Flow
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-600">API: /api/teams/register, /api/auth/team/login, /api/auth/team/me</p>
            </div>

            <div className="rounded-xl border border-slate-300/80 bg-slate-50 p-4">
              <h3 className="text-sm font-black text-slate-900">Admin</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/signup?role=admin" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                  Create Account
                </Link>
                <Link to="/login?role=admin" className="rounded-lg border border-slate-400 px-3 py-1.5 text-xs font-bold text-slate-800">
                  Login Flow
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-600">API: /api/auth/signup, /api/auth/login, /api/teams/admin</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
