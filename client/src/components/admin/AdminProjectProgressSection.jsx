import { useState } from 'react'

const BASE_TASKS = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'aiModelImplementation', label: 'AI Model (Gen AI)' },
  { key: 'projectReport', label: 'Project Report' },
  { key: 'presentationPpt', label: 'PPT' },
  { key: 'deployment', label: 'Deployment' }
]

const toProgress = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

const averageProgress = (progress = {}, customTopics = []) => {
  const allTasks = [...BASE_TASKS, ...customTopics]
  if (allTasks.length === 0) {
    return 0
  }

  const total = allTasks.reduce((sum, task) => {
    const value = task.scope === 'custom'
      ? toProgress(progress?.customTasks?.[task.key]?.progress)
      : toProgress(progress?.[task.key]?.progress)
    return sum + value
  }, 0)

  return Math.round(total / allTasks.length)
}

const lockedCount = (progress = {}, customTopics = []) => {
  const baseLocked = BASE_TASKS.reduce((count, task) => count + (progress?.[task.key]?.isLocked ? 1 : 0), 0)
  const customLocked = customTopics.reduce(
    (count, task) => count + (progress?.customTasks?.[task.key]?.isLocked ? 1 : 0),
    0
  )
  return baseLocked + customLocked
}

export function AdminProjectProgressSection({
  teams = [],
  progressTopics = [],
  topicPending = false,
  topicMessage = '',
  onCreateTopic,
  onToggleTopicActive,
  onUpdateTopicLabel,
  onDeleteTopic
}) {
  const [topicLabel, setTopicLabel] = useState('')
  const [editingTopicId, setEditingTopicId] = useState('')
  const [editingTopicLabel, setEditingTopicLabel] = useState('')

  const customTasks = progressTopics.map((topic) => ({
    key: topic.key,
    label: topic.label,
    scope: 'custom',
    id: topic._id || topic.id,
    active: topic.active !== false
  }))
  const allTaskCount = BASE_TASKS.length + customTasks.length

  const rows = teams
    .filter((team) => team.registrationStatus === 'approved')
    .map((team) => ({
      ...team,
      projectProgress: team.projectProgress || {}
    }))

  const handleCreate = async (event) => {
    event.preventDefault()
    const trimmed = String(topicLabel || '').trim()
    if (!trimmed || !onCreateTopic) {
      return
    }

    const success = await onCreateTopic(trimmed)
    if (success) {
      setTopicLabel('')
    }
  }

  const handleStartEditTopic = (topic) => {
    setEditingTopicId(topic.id || topic.key)
    setEditingTopicLabel(topic.label)
  }

  const handleCancelEditTopic = () => {
    setEditingTopicId('')
    setEditingTopicLabel('')
  }

  const handleSaveEditTopic = async (topic) => {
    const nextLabel = String(editingTopicLabel || '').trim()
    if (!nextLabel || !onUpdateTopicLabel) {
      return
    }

    const success = await onUpdateTopicLabel(topic, nextLabel)
    if (success) {
      handleCancelEditTopic()
    }
  }

  const handleDeleteTopic = async (topic) => {
    if (!onDeleteTopic) {
      return
    }

    const success = await onDeleteTopic(topic)
    if (success && editingTopicId === (topic.id || topic.key)) {
      handleCancelEditTopic()
    }
  }

  return (
    <section className="rounded-2xl border border-violet-300/30 bg-violet-900/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-black text-violet-100">Project Progress Monitor</h2>
        <span className="rounded-full border border-violet-200/40 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-100">
          Teams: {rows.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-violet-100/90">
        Add custom project topics here. Teams can update and lock/unlock their progress for all active topics.
      </p>

      <div className="mt-4 rounded-xl border border-violet-300/30 bg-black/20 p-4">
        <h3 className="text-sm font-bold text-violet-100">Custom Progress Topics</h3>
        <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={handleCreate}>
          <input
            type="text"
            value={topicLabel}
            onChange={(event) => setTopicLabel(event.target.value)}
            placeholder="Add custom topic (for example: Testing, Documentation)"
            className="min-w-65 flex-1 rounded-lg border border-violet-300/30 bg-slate-900/70 px-3 py-2 text-sm text-violet-50"
          />
          <button
            type="submit"
            disabled={topicPending}
            className="rounded-lg border border-violet-200/60 bg-violet-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {topicPending ? 'Adding...' : 'Add Topic'}
          </button>
        </form>

        {topicMessage ? (
          <div className="mt-3 rounded-lg border border-violet-200/30 bg-violet-500/20 px-3 py-2 text-xs text-violet-100">
            {topicMessage}
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          {customTasks.length === 0 ? (
            <span className="text-xs text-violet-100/90">No custom topics yet.</span>
          ) : (
            customTasks.map((topic) => {
              const topicId = topic.id || topic.key
              const isEditing = editingTopicId === topicId

              return (
                <div key={topicId} className="rounded-lg border border-violet-300/20 bg-slate-900/50 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTopicLabel}
                        onChange={(event) => setEditingTopicLabel(event.target.value)}
                        className="min-w-52 flex-1 rounded-lg border border-violet-300/40 bg-slate-900 px-2 py-1 text-xs text-violet-50"
                      />
                    ) : (
                      <span className="flex-1 text-xs font-semibold text-violet-100">{topic.label}</span>
                    )}

                    <button
                      type="button"
                      disabled={topicPending || !onToggleTopicActive}
                      onClick={() => onToggleTopicActive(topic)}
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                        topic.active
                          ? 'border-emerald-300/50 bg-emerald-900/30 text-emerald-100'
                          : 'border-slate-400/50 bg-slate-800 text-slate-200'
                      }`}
                    >
                      {topic.active ? 'Active' : 'Inactive'}
                    </button>

                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          disabled={topicPending || !onUpdateTopicLabel}
                          onClick={() => handleSaveEditTopic(topic)}
                          className="rounded-lg border border-cyan-300/40 bg-cyan-900/30 px-2 py-1 text-[10px] font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          disabled={topicPending}
                          onClick={handleCancelEditTopic}
                          className="rounded-lg border border-slate-300/40 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={topicPending}
                        onClick={() => handleStartEditTopic(topic)}
                        className="rounded-lg border border-cyan-300/40 bg-cyan-900/30 px-2 py-1 text-[10px] font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={topicPending || !onDeleteTopic}
                      onClick={() => handleDeleteTopic(topic)}
                      className="rounded-lg border border-rose-300/40 bg-rose-900/30 px-2 py-1 text-[10px] font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-lg border border-white/20 bg-black/20 px-3 py-3 text-sm text-cyan-100">
          No approved teams available.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {rows.map((team) => {
            const progress = team.projectProgress || {}
            const overall = averageProgress(progress, customTasks)
            const locked = lockedCount(progress, customTasks)

            return (
              <article key={team._id} className="rounded-xl border border-white/20 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {team.teamNumber} - {team.teamName}
                    </h3>
                    <p className="text-xs text-cyan-100/90">Lead: {team.leadName}</p>
                  </div>
                  <div className="text-right text-xs text-cyan-100">
                    <div>Overall: <strong>{overall}%</strong></div>
                    <div>Locked: <strong>{locked}/{allTaskCount}</strong></div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {[...BASE_TASKS, ...customTasks].map((task) => {
                    const taskState = task.scope === 'custom'
                      ? progress?.customTasks?.[task.key] || {}
                      : progress?.[task.key] || {}
                    const value = toProgress(taskState.progress)
                    const isLocked = Boolean(taskState.isLocked)

                    return (
                      <div key={`${team._id}-${task.key}`} className="rounded-lg border border-white/15 bg-slate-900/70 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-cyan-50">{task.label}</span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                            isLocked
                              ? 'border border-emerald-300/40 bg-emerald-900/30 text-emerald-100'
                              : 'border border-amber-300/40 bg-amber-900/30 text-amber-100'
                          }`}>
                            {isLocked ? 'Locked' : 'Editable'}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                          <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${value}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-cyan-100">{value}%</p>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
