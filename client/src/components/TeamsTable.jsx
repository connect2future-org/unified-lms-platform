import { formatDateTime } from '../utils/date'

export function TeamsTable({ teams }) {
  if (!teams.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d6cab5] bg-white p-8 text-center text-slate-600">
        No teams registered yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eadfcd] bg-white shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-sky-900 text-xs uppercase tracking-wider text-sky-50">
            <tr>
              <th className="px-4 py-3">Team Number</th>
              <th className="px-4 py-3">Team Name</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">USN</th>
              <th className="px-4 py-3">College</th>
              <th className="px-4 py-3">Assigned Project</th>
              <th className="px-4 py-3">Registered At</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team._id} className="border-t border-[#f0e6d8] hover:bg-sky-50/50">
                <td className="px-4 py-3 font-semibold text-sky-800">{team.teamNumber}</td>
                <td className="px-4 py-3">{team.teamName}</td>
                <td className="px-4 py-3">{team.leadName}</td>
                <td className="px-4 py-3">{team.leadUsn}</td>
                <td className="px-4 py-3">{team.college}</td>
                <td className="px-4 py-3">
                  {team.assignedProject?.title || (team.customProjectIdea?.title
                    ? `${team.customProjectIdea.title} (Pending Approval)`
                    : '-')}
                </td>
                <td className="px-4 py-3">{formatDateTime(team.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
