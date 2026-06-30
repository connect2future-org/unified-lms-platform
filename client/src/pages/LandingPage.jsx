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

      </section>
    </PageShell>
  )
}
