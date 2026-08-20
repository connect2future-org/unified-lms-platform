const TAB_META = {
  approval: {
    label: 'Approval',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  edit: {
    label: 'Edit',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  directory: {
    label: 'Directory',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  projects: {
    label: 'Projects',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  progress: {
    label: 'Progress',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  github: {
    label: 'GitHub',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  revoke: {
    label: 'Revoke',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  security: {
    label: 'Password Security',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  migration: {
    label: 'Migration',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  },
  bulkUpdate: {
    label: 'Bulk Update Teams',
    active: 'bg-blue-300 text-slate-950 shadow-sm',
    idle: 'border border-blue-300/40 bg-slate-800 text-blue-100 hover:bg-slate-700'
  }
}

export function AdminFlowTabs({ activeFlow, onChange, counts }) {
  const order = ['approval', 'edit', 'directory', 'projects', 'progress', 'github', 'revoke', 'security', 'migration', 'bulkUpdate']

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
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
