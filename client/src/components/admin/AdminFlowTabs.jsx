const TAB_META = {
  approval: {
    label: 'Approval',
    active: 'bg-indigo-300 text-slate-950 shadow-sm',
    idle: 'border border-indigo-300/40 bg-slate-800 text-indigo-100 hover:bg-slate-700'
  },
  edit: {
    label: 'Edit',
    active: 'bg-cyan-300 text-slate-950 shadow-sm',
    idle: 'border border-cyan-300/40 bg-slate-800 text-cyan-100 hover:bg-slate-700'
  },
  directory: {
    label: 'Directory',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  projects: {
    label: 'Projects',
    active: 'bg-amber-300 text-slate-950 shadow-sm',
    idle: 'border border-amber-300/40 bg-slate-800 text-amber-100 hover:bg-slate-700'
  },
  github: {
    label: 'GitHub',
    active: 'bg-sky-300 text-slate-950 shadow-sm',
    idle: 'border border-sky-300/40 bg-slate-800 text-sky-100 hover:bg-slate-700'
  },
  revoke: {
    label: 'Revoke',
    active: 'bg-rose-300 text-slate-950 shadow-sm',
    idle: 'border border-rose-300/40 bg-slate-800 text-rose-100 hover:bg-slate-700'
  },
  security: {
    label: 'Password Security',
    active: 'bg-emerald-300 text-slate-950 shadow-sm',
    idle: 'border border-emerald-300/40 bg-slate-800 text-emerald-100 hover:bg-slate-700'
  },
  migration: {
    label: 'Migration',
    active: 'bg-fuchsia-300 text-slate-950 shadow-sm',
    idle: 'border border-fuchsia-300/40 bg-slate-800 text-fuchsia-100 hover:bg-slate-700'
  },
  bulkUpdate: {
    label: 'Bulk Update Teams',
    active: 'bg-teal-300 text-slate-950 shadow-sm',
    idle: 'border border-teal-300/40 bg-slate-800 text-teal-100 hover:bg-slate-700'
  }
}

export function AdminFlowTabs({ activeFlow, onChange, counts }) {
  const order = ['approval', 'edit', 'directory', 'projects', 'github', 'revoke', 'security', 'migration', 'bulkUpdate']

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-8">
        {order.map((key) => {
          const meta = TAB_META[key]
          const isActive = activeFlow === key
          const count = counts?.[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition ${isActive ? meta.active : meta.idle}`}
            >
              {meta.label}{typeof count === 'number' ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}
