export function StatsCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-[#eadfcd] bg-white p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-widest text-sky-800/90">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  )
}
