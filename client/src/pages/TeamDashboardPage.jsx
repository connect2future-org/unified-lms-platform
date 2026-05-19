import { useEffect, useState } from 'react'
import { ActionDialog } from '../components/ActionDialog'
import { MemberFields } from '../components/MemberFields'
import { PageShell } from '../components/PageShell'
import {
  changeTeamPassword,
  clearTeamSession,
  getTeamMe,
  getTeamProfile,
  getRegistrationLookups,
  getTeamToken,
  previewTeamCustomIdeaFile,
  recallTeamProfileUpdateRequest,
  submitTeamGithubRepository,
  submitTeamProjectProgress,
  submitTeamCustomProjectIdeaRequest,
  submitTeamProfileUpdateRequest,
  uploadTeamCustomIdeaFile
} from '../services/api'
import { deleteTeam } from '../services/api' // Import the delete function

const TABS = [
  { key: 'profile', label: 'Team Profile' },
  { key: 'github', label: 'GitHub Collaboration' },
  { key: 'idea', label: 'New Project Idea' },
  { key: 'progress', label: 'Project Progress' },
  { key: 'update', label: 'Student Details Change' },
  { key: 'password', label: 'Change Password' }
]

const BASE_PROJECT_PROGRESS_TASKS = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'aiModelImplementation', label: 'AI Model Implementation (Gen AI)' },
  { key: 'projectReport', label: 'Project Report' },
  { key: 'presentationPpt', label: 'PPT for Presentation' },
  { key: 'deployment', label: 'Deployment' }
]

const toCustomTopicClientKey = (topicKey) => `custom__${topicKey}`

const getProgressTaskDefinitions = (progressTopics = []) => {
  const customTasks = (progressTopics || []).map((topic) => ({
    key: toCustomTopicClientKey(topic.key),
    label: topic.label,
    scope: 'custom',
    requestKey: topic.key
  }))

  return [
    ...BASE_PROJECT_PROGRESS_TASKS.map((task) => ({ ...task, scope: 'base', requestKey: task.key })),
    ...customTasks
  ]
}

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

const initialIdeaDraft = {
  title: '',
  description: '',
  difficulty: 'Medium',
  domain: '',
  technologies: ''
}

const fallbackMembers = [
  { name: '', usn: '', email: '' },
  { name: '', usn: '', email: '' }
]

const normalizeTechnologies = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const buildProfileDraft = (team) => ({
  teamName: team?.teamName || '',
  leadName: team?.leadName || '',
  leadEmail: team?.leadEmail || '',
  leadUsn: team?.leadUsn || '',
  leadPhone: team?.leadPhone || '',
  college: team?.college || '',
  department: team?.department || '',
  requestNote: ''
})

const buildProjectProgressDraft = (progress, progressTopics = []) => {
  const source = progress && typeof progress === 'object' ? progress : {}
  const draft = {}

  BASE_PROJECT_PROGRESS_TASKS.forEach((task) => {
    const taskProgress = source?.[task.key] || {}
    const normalizedProgress = Number(taskProgress.progress)

    draft[task.key] = {
      progress: Number.isFinite(normalizedProgress)
        ? Math.max(0, Math.min(100, Math.round(normalizedProgress)))
        : 0,
      isLocked: Boolean(taskProgress.isLocked),
      updatedAt: taskProgress.updatedAt || null,
      lockedAt: taskProgress.lockedAt || null,
      resetRequest: taskProgress.resetRequest || { status: 'none' }
    }
  })

  ;(progressTopics || []).forEach((topic) => {
    const clientKey = toCustomTopicClientKey(topic.key)
    const taskProgress = source?.customTasks?.[topic.key] || {}
    const normalizedProgress = Number(taskProgress.progress)

    draft[clientKey] = {
      progress: Number.isFinite(normalizedProgress)
        ? Math.max(0, Math.min(100, Math.round(normalizedProgress)))
        : 0,
      isLocked: Boolean(taskProgress.isLocked),
      updatedAt: taskProgress.updatedAt || null,
      lockedAt: taskProgress.lockedAt || null,
      resetRequest: taskProgress.resetRequest || { status: 'none' }
    }
  })

  return draft
}

export function TeamDashboardPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [team, setTeam] = useState(getTeamProfile())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [passwordForm, setPasswordForm] = useState(initialPasswordForm)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const [profileDraft, setProfileDraft] = useState(buildProfileDraft(getTeamProfile()))
  const [profileMembers, setProfileMembers] = useState(getTeamProfile()?.members || fallbackMembers)
  const [profileRequestLoading, setProfileRequestLoading] = useState(false)
  const [profileRequestError, setProfileRequestError] = useState('')
  const [profileRequestMessage, setProfileRequestMessage] = useState('')
  const [lookupOptions, setLookupOptions] = useState({ colleges: [], departments: [], progressTopics: [] })
  const [lookupLoading, setLookupLoading] = useState(true)
  const [lookupError, setLookupError] = useState('')
  const [showRecallDialog, setShowRecallDialog] = useState(false)

  const [ideaDraft, setIdeaDraft] = useState(initialIdeaDraft)
  const [ideaRequestLoading, setIdeaRequestLoading] = useState(false)
  const [ideaRequestError, setIdeaRequestError] = useState('')
  const [ideaRequestMessage, setIdeaRequestMessage] = useState('')

  const [ideaFile, setIdeaFile] = useState(null)
  const [ideaUploadLoading, setIdeaUploadLoading] = useState(false)
  const [ideaUploadError, setIdeaUploadError] = useState('')
  const [ideaUploadMessage, setIdeaUploadMessage] = useState('')
  const [ideaPreview, setIdeaPreview] = useState(null)
  const [githubRepoUrl, setGithubRepoUrl] = useState(getTeamProfile()?.githubRepoUrl || '')
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubError, setGithubError] = useState('')
  const [githubMessage, setGithubMessage] = useState('')
  const [projectProgress, setProjectProgress] = useState(
    buildProjectProgressDraft(getTeamProfile()?.projectProgress)
  )
  const [progressIncrementDraft, setProgressIncrementDraft] = useState({})
  const [progressIncrementErrors, setProgressIncrementErrors] = useState({})
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressError, setProgressError] = useState('')
  const [progressMessage, setProgressMessage] = useState('')

  useEffect(() => {
    const token = getTeamToken()

    const load = async () => {
      if (!token) {
        setLoading(false)
        setError('Your team session expired. Please login again.')
        return
      }

      try {
        const response = await getTeamMe(token)
        setTeam(response.team)
        setGithubRepoUrl(response.team.githubRepoUrl || '')

        const source = response.team.profileUpdateRequest?.status === 'pending'
          ? response.team.profileUpdateRequest?.payload
          : response.team

        setProfileDraft(buildProfileDraft(source))
        setProfileMembers((source?.members || response.team.members || fallbackMembers).map((member) => ({
          name: member.name || '',
          usn: member.usn || '',
          email: member.email || ''
        })))
      } catch {
        clearTeamSession()
        setError('Your team session expired. Please login again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadLookups = async () => {
      setLookupLoading(true)
      setLookupError('')

      try {
        const data = await getRegistrationLookups()
        if (cancelled) return
        const progressTopics = Array.isArray(data?.progressTopics) ? data.progressTopics : []
        setLookupOptions({
          colleges: Array.isArray(data?.colleges) ? data.colleges : [],
          departments: Array.isArray(data?.departments) ? data.departments : [],
          progressTopics
        })
      } catch {
        if (cancelled) return
        setLookupError('Failed to load college/department options')
      } finally {
        if (!cancelled) {
          setLookupLoading(false)
        }
      }
    }

    loadLookups()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setProjectProgress(buildProjectProgressDraft(team?.projectProgress, lookupOptions.progressTopics))
    setProgressIncrementDraft({})
    setProgressIncrementErrors({})
  }, [team, lookupOptions.progressTopics])

  const updatePasswordField = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateProfileDraftField = (field, value) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }))
  }

  const updateIdeaDraftField = (field, value) => {
    setIdeaDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordMessage('')

    try {
      const result = await changeTeamPassword(passwordForm)
      setTeam(result.team)
      setPasswordForm(initialPasswordForm)
      setPasswordMessage(result.message || 'Password updated successfully')
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleSubmitProfileRequest = async (event) => {
    event.preventDefault()
    setProfileRequestLoading(true)
    setProfileRequestError('')
    setProfileRequestMessage('')

    try {
      const result = await submitTeamProfileUpdateRequest({
        ...profileDraft,
        members: profileMembers
      })
      setTeam(result.team)
      setProfileRequestMessage(result.message || 'Profile update request submitted for admin approval')
    } catch (requestError) {
      setProfileRequestError(requestError.response?.data?.message || 'Failed to submit update request')
    } finally {
      setProfileRequestLoading(false)
    }
  }

  const handleRecallProfileRequest = async () => {
    setProfileRequestLoading(true)
    setProfileRequestError('')
    setProfileRequestMessage('')

    try {
      const result = await recallTeamProfileUpdateRequest()
      setTeam(result.team)
      setProfileRequestMessage(result.message || 'Profile update request recalled')
    } catch (requestError) {
      setProfileRequestError(requestError.response?.data?.message || 'Failed to recall request')
    } finally {
      setProfileRequestLoading(false)
      setShowRecallDialog(false)
    }
  }

  const handleSubmitIdeaRequest = async (event) => {
    event.preventDefault()
    setIdeaRequestLoading(true)
    setIdeaRequestError('')
    setIdeaRequestMessage('')

    try {
      const result = await submitTeamCustomProjectIdeaRequest({
        title: ideaDraft.title,
        description: ideaDraft.description,
        difficulty: ideaDraft.difficulty,
        domain: ideaDraft.domain,
        technologies: normalizeTechnologies(ideaDraft.technologies)
      })

      setTeam(result.team)
      setIdeaDraft(initialIdeaDraft)
      setIdeaRequestMessage(result.message || 'Custom project idea submitted for admin approval')
    } catch (requestError) {
      setIdeaRequestError(requestError.response?.data?.message || 'Failed to submit custom project idea')
    } finally {
      setIdeaRequestLoading(false)
    }
  }

  const handleIdeaFilePreview = async () => {
    if (!ideaFile) {
      setIdeaUploadError('Select an Excel or PDF file first')
      return
    }

    setIdeaUploadLoading(true)
    setIdeaUploadError('')
    setIdeaUploadMessage('')

    try {
      const data = await previewTeamCustomIdeaFile(ideaFile)
      setIdeaPreview(data)
      setIdeaUploadMessage('Preview generated. Verify details and submit.')
    } catch (requestError) {
      setIdeaPreview(null)
      setIdeaUploadError(requestError.response?.data?.message || 'Preview failed')
    } finally {
      setIdeaUploadLoading(false)
    }
  }

  const handleIdeaFileUpload = async () => {
    if (!ideaFile) {
      setIdeaUploadError('Select an Excel or PDF file first')
      return
    }

    setIdeaUploadLoading(true)
    setIdeaUploadError('')
    setIdeaUploadMessage('')

    try {
      const data = await uploadTeamCustomIdeaFile(ideaFile)
      setTeam(data.team)
      setIdeaFile(null)
      setIdeaPreview(null)
      setIdeaUploadMessage(data.message || 'Custom project idea submitted for admin approval')
    } catch (requestError) {
      setIdeaUploadError(requestError.response?.data?.message || 'Upload failed')
    } finally {
      setIdeaUploadLoading(false)
    }
  }

  const handleSubmitGithubRepository = async (event) => {
    event.preventDefault()
    setGithubLoading(true)
    setGithubError('')
    setGithubMessage('')

    try {
      const result = await submitTeamGithubRepository({ githubRepoUrl })
      setTeam(result.team)
      setGithubRepoUrl(result.team.githubRepoUrl || '')
      setGithubMessage(result.message || 'GitHub URL saved')
    } catch (requestError) {
      setGithubError(requestError.response?.data?.message || 'Failed to save GitHub URL')
    } finally {
      setGithubLoading(false)
    }
  }

  const pendingProfileRequest = team?.profileUpdateRequest?.status === 'pending'
  const pendingGithubReviewNeedsResubmission =
    team?.collaborationStatus === 'pending' && Boolean(team?.collaborationMarkedBy)
  const progressTaskDefinitions = getProgressTaskDefinitions(lookupOptions.progressTopics)

  const averageProgress = Math.round(
    (progressTaskDefinitions.reduce((sum, task) => sum + Number(projectProgress?.[task.key]?.progress || 0), 0) || 0) /
      (progressTaskDefinitions.length || 1)
  )

  const getPriorTaskProgress = (task) => {
    const teamProgress = team?.projectProgress || {}
    const rawValue = task.scope === 'custom'
      ? teamProgress?.customTasks?.[task.requestKey]?.progress
      : teamProgress?.[task.requestKey]?.progress

    const normalized = Number(rawValue)
    if (!Number.isFinite(normalized)) {
      return 0
    }

    return Math.max(0, Math.min(100, Math.round(normalized)))
  }

  const handleProgressIncreaseChange = (task, rawValue) => {
    const taskKey = task.key
    const priorProgress = getPriorTaskProgress(task)
    const textValue = String(rawValue ?? '')

    setProgressIncrementDraft((prev) => ({
      ...prev,
      [taskKey]: textValue,
    }))

    const trimmed = textValue.trim()
    if (!trimmed) {
      setProgressIncrementErrors((prev) => {
        const next = { ...prev }
        delete next[taskKey]
        return next
      })
      setProjectProgress((prev) => {
        const current = prev?.[taskKey]
        if (!current) {
          return prev
        }

        return {
          ...prev,
          [taskKey]: {
            ...current,
            progress: priorProgress,
          },
        }
      })
      return
    }

    const increment = Number(trimmed)
    if (!Number.isFinite(increment) || increment < 0 || increment > 100) {
      setProgressIncrementErrors((prev) => ({
        ...prev,
        [taskKey]: 'Enter a number between 0 and 100.',
      }))
      return
    }

    const newProgress = priorProgress + increment
    if (newProgress > 100) {
      setProgressIncrementErrors((prev) => ({
        ...prev,
        [taskKey]: `Cumulative progress cannot exceed 100%. Prior is ${priorProgress}%.`,
      }))
      return
    }

    if (newProgress < priorProgress) {
      setProgressIncrementErrors((prev) => ({
        ...prev,
        [taskKey]: `Progress cannot be decreased. Current progress is ${priorProgress}%.`,
      }))
      return
    }

    setProgressIncrementErrors((prev) => {
      const next = { ...prev }
      delete next[taskKey]
      return next
    })

    setProjectProgress((prev) => {
      const current = prev?.[taskKey]
      if (!current) {
        return prev
      }

      return {
        ...prev,
        [taskKey]: {
          ...current,
          progress: newProgress,
        },
      }
    })
  }

  const hasProgressIncrementErrors = Object.keys(progressIncrementErrors).length > 0

  const handleSaveProjectProgress = async () => {
    setProgressLoading(true)
    setProgressError('')
    setProgressMessage('')

    try {
      const tasks = BASE_PROJECT_PROGRESS_TASKS.reduce((acc, task) => {
        const current = projectProgress?.[task.key] || {}
        acc[task.key] = {
          progress: Number(current.progress || 0),
          isLocked: Boolean(current.isLocked)
        }
        return acc
      }, {})

      const customTasks = (lookupOptions.progressTopics || []).reduce((acc, topic) => {
        const clientKey = toCustomTopicClientKey(topic.key)
        const current = projectProgress?.[clientKey] || {}
        acc[topic.key] = {
          progress: Number(current.progress || 0),
          isLocked: Boolean(current.isLocked)
        }
        return acc
      }, {})

      const result = await submitTeamProjectProgress({ tasks, customTasks })
      setTeam(result.team)
      setProjectProgress(buildProjectProgressDraft(result.team?.projectProgress, lookupOptions.progressTopics))
      setProgressMessage(result.message || 'Project progress saved')
    } catch (requestError) {
      setProgressError(requestError.response?.data?.message || 'Failed to save project progress')
    } finally {
      setProgressLoading(false)
    }
  }

  const handleDeleteProgress = async () => {
    if (!window.confirm('Are you sure you want to delete this team and its progress data? This action cannot be undone.')) {
      return;
    }

    try {
      setProgressLoading(true);
      await deleteTeam(team._id); // Call the delete API
      alert('Team and progress data deleted successfully.');
      window.location.reload(); // Refresh the page or redirect as needed
    } catch (error) {
      console.error('Failed to delete team:', error);
      alert('Failed to delete team. Please try again.');
    } finally {
      setProgressLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-white/20 bg-black/20 p-6 text-cyan-100">
          Loading team dashboard...
        </div>
      </PageShell>
    )
  }

  if (error || !team) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-rose-300/30 bg-rose-900/30 p-6 text-rose-100">
          {error || 'Unable to load team session. Please login again.'}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <section className="team-dashboard-page space-y-6">
        <header className="rounded-2xl border border-white/20 bg-white/10 p-5">
          <h1 className="text-2xl font-black text-white md:text-3xl">Team Dashboard</h1>
          <p className="mt-2 text-sm text-cyan-100">
            Team {team.teamNumber} - {team.teamName}
          </p>
        </header>

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.key
                  ? 'bg-cyan-400 text-slate-900'
                  : 'border border-white/30 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100">
              <h2 className="text-xl font-black">Assigned Project</h2>
              {team.assignedProject?.title ? (
                <div className="mt-3 space-y-2 text-sm text-cyan-50">
                  <p><strong>Title:</strong> {team.assignedProject.title}</p>
                  <p><strong>Description:</strong> {team.assignedProject.description || '-'}</p>
                  <p><strong>Difficulty:</strong> {team.assignedProject.difficulty || '-'}</p>
                  <p><strong>Domain:</strong> {team.assignedProject.domain || '-'}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-cyan-100">Project not assigned yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100">
              <h2 className="text-xl font-black">Current Team Details</h2>
              <div className="mt-3 grid gap-2 text-sm text-cyan-50 md:grid-cols-2">
                <p><strong>Team Number:</strong> {team.teamNumber}</p>
                <p><strong>Team Name:</strong> {team.teamName}</p>
                <p><strong>Lead Name:</strong> {team.leadName}</p>
                <p><strong>Lead Email:</strong> {team.leadEmail}</p>
                <p><strong>Lead USN:</strong> {team.leadUsn}</p>
                <p><strong>Lead Phone:</strong> {team.leadPhone}</p>
                <p><strong>College:</strong> {team.college}</p>
                <p><strong>Department:</strong> {team.department}</p>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-black uppercase tracking-wide text-cyan-100">Members</h3>
                <div className="mt-2 space-y-2 text-sm text-cyan-50">
                  {(team.members || []).map((member, index) => (
                    <div key={`${member.usn || member.email || index}-profile`} className="rounded-lg border border-white/20 bg-black/20 p-2">
                      <p><strong>Name:</strong> {member.name || '-'}</p>
                      <p><strong>USN:</strong> {member.usn || '-'}</p>
                      <p><strong>Email:</strong> {member.email || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'github' ? (
          <form onSubmit={handleSubmitGithubRepository} className="rounded-2xl border border-white/20 bg-white/10 p-6 text-slate-100">
            <h2 className="text-xl font-black">GitHub Collaboration</h2>
            <p className="mt-1 text-sm text-cyan-100">
              Add your repository URL. Status stays pending until admin confirms collaboration.
            </p>

            {pendingGithubReviewNeedsResubmission ? (
              <div className="mt-3 rounded-lg border border-amber-300/40 bg-amber-900/30 px-3 py-2 text-sm text-amber-100">
                Admin marked your GitHub collaboration as pending. Please resubmit your GitHub repository URL.
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                required
                type="url"
                value={githubRepoUrl}
                onChange={(event) => setGithubRepoUrl(event.target.value)}
                placeholder="https://github.com/org/repo"
                className="md:col-span-2 rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <button
                type="submit"
                disabled={githubLoading}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {githubLoading ? 'Saving...' : 'Save GitHub URL'}
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-white/20 bg-black/20 p-3 text-sm text-cyan-50">
              <p>
                <strong>Current Status:</strong>{' '}
                {team.collaborationStatus === 'collaborated' ? 'Collaborated' : 'Pending'}
              </p>
              <p className="mt-1">
                <strong>Last Reviewed By Admin:</strong> {team.collaborationMarkedBy || '-'}
              </p>
              {team.githubRepoUrl ? (
                <p className="mt-1 break-all">
                  <strong>Repository:</strong>{' '}
                  <a
                    href={team.githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-cyan-300 underline hover:text-cyan-200"
                  >
                    {team.githubRepoUrl}
                  </a>
                </p>
              ) : null}
            </div>

            {githubError ? (
              <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
                {githubError}
              </div>
            ) : null}

            {githubMessage ? (
              <div className="mt-3 rounded-lg border border-emerald-300/40 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-100">
                {githubMessage}
              </div>
            ) : null}
          </form>
        ) : null}

        {activeTab === 'idea' ? (
          <div className="space-y-6">
            <form onSubmit={handleSubmitIdeaRequest} className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <h2 className="text-xl font-black text-white">Submit Idea Manually</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  required
                  value={ideaDraft.title}
                  onChange={(event) => updateIdeaDraftField('title', event.target.value)}
                  placeholder="Idea title"
                  className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
                />
                <input
                  required
                  value={ideaDraft.domain}
                  onChange={(event) => updateIdeaDraftField('domain', event.target.value)}
                  placeholder="Domain"
                  className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
                />
                <select
                  value={ideaDraft.difficulty}
                  onChange={(event) => updateIdeaDraftField('difficulty', event.target.value)}
                  className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <input
                  required
                  value={ideaDraft.technologies}
                  onChange={(event) => updateIdeaDraftField('technologies', event.target.value)}
                  placeholder="React, Node.js, MongoDB"
                  className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
                />
              </div>
              <textarea
                required
                rows={4}
                value={ideaDraft.description}
                onChange={(event) => updateIdeaDraftField('description', event.target.value)}
                placeholder="Idea description"
                className="mt-4 w-full rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />

              {ideaRequestError ? (
                <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
                  {ideaRequestError}
                </div>
              ) : null}

              {ideaRequestMessage ? (
                <div className="mt-3 rounded-lg border border-emerald-300/40 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-100">
                  {ideaRequestMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={ideaRequestLoading}
                className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ideaRequestLoading ? 'Submitting...' : 'Submit Manual Idea'}
              </button>
            </form>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <h2 className="text-xl font-black text-white">Upload Idea File (Individual)</h2>
              <p className="mt-2 text-sm text-cyan-100">Upload one Excel/PDF file, preview, then submit.</p>

              <input
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={(event) => setIdeaFile(event.target.files?.[0] || null)}
                className="mt-4 block w-full rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleIdeaFilePreview}
                  disabled={ideaUploadLoading || !ideaFile}
                  className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ideaUploadLoading ? 'Working...' : 'Preview File'}
                </button>
                <button
                  type="button"
                  onClick={handleIdeaFileUpload}
                  disabled={ideaUploadLoading || !ideaFile}
                  className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ideaUploadLoading ? 'Uploading...' : 'Submit File Idea'}
                </button>
              </div>

              {ideaUploadError ? (
                <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
                  {ideaUploadError}
                </div>
              ) : null}

              {ideaUploadMessage ? (
                <div className="mt-3 rounded-lg border border-cyan-300/40 bg-cyan-900/30 px-3 py-2 text-sm text-cyan-100">
                  {ideaUploadMessage}
                </div>
              ) : null}

              {ideaPreview ? (
                <div className="mt-4 rounded-xl border border-white/20 bg-black/20 p-4 text-sm text-cyan-50">
                  <p><strong>Title:</strong> {ideaPreview.title || '-'}</p>
                  <p><strong>Description:</strong> {ideaPreview.description || '-'}</p>
                  <p><strong>Difficulty:</strong> {ideaPreview.difficulty || '-'}</p>
                  <p><strong>Domain:</strong> {ideaPreview.domain || '-'}</p>
                  <p>
                    <strong>Technologies:</strong>{' '}
                    {Array.isArray(ideaPreview.technologies)
                      ? ideaPreview.technologies.join(', ')
                      : ideaPreview.technologies || '-'}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'progress' ? (
          <section className="rounded-2xl border border-white/20 bg-white/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">Project Progress Tracker</h2>
                <p className="mt-1 text-sm text-cyan-100">
                  Update progress any number of times until 100%. Progress only moves forward and cannot be decreased.
                </p>
              </div>
              <div className="rounded-lg border border-white/30 bg-black/20 px-3 py-2 text-xs text-cyan-50">
                <div>Overall Progress: <strong>{averageProgress}%</strong></div>
                <div>Total Tasks: <strong>{progressTaskDefinitions.length}</strong></div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {progressTaskDefinitions.map((task) => {
                const state = projectProgress?.[task.key] || {}
                const progressValue = Number(state.progress || 0)

                return (
                  <div key={task.key} className="rounded-xl border border-white/20 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-cyan-50">{task.label}</h3>
                      <span className="rounded-full border border-cyan-300/40 bg-cyan-900/30 px-2 py-1 text-xs font-semibold text-cyan-100">
                        Update Mode
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-cyan-100 md:flex-1">
                        <span>Increase by</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          inputMode="numeric"
                          value={progressIncrementDraft[task.key] ?? ''}
                          disabled={progressLoading}
                          onChange={(event) => handleProgressIncreaseChange(task, event.target.value)}
                          placeholder="0-100"
                          className="w-24 rounded border border-white/30 bg-black/30 px-2 py-1 text-sm text-cyan-50"
                        />
                      </label>
                      <span className="text-sm font-semibold text-cyan-50">
                        Prior {getPriorTaskProgress(task)}% {'->'} New {progressValue}%
                      </span>
                    </div>

                    {progressIncrementErrors[task.key] ? (
                      <div className="mt-2 rounded border border-rose-300/40 bg-rose-900/30 px-2 py-1 text-[11px] text-rose-100">
                        {progressIncrementErrors[task.key]}
                      </div>
                    ) : (
                      <div className="mt-2 rounded border border-cyan-300/30 bg-cyan-950/40 px-2 py-1 text-[11px] text-cyan-100/90">
                        Example: prior 60 + 10 = 70. You can update again later until it reaches 100%.
                      </div>
                    )}

                    <div className="mt-3 h-2 w-full rounded-full bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-cyan-400"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {progressError ? (
              <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
                {progressError}
              </div>
            ) : null}

            {progressMessage ? (
              <div className="mt-3 rounded-lg border border-emerald-300/40 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-100">
                {progressMessage}
              </div>
            ) : null}

            <button
              type="button"
              disabled={progressLoading || hasProgressIncrementErrors}
              onClick={handleSaveProjectProgress}
              className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {progressLoading ? 'Updating...' : 'Update Progress'}
            </button>
          </section>
        ) : null}

        {activeTab === 'update' ? (
          <form onSubmit={handleSubmitProfileRequest} className="rounded-2xl border border-white/20 bg-white/10 p-6">
            <h2 className="text-xl font-black text-white">Request Student Details Update</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                required
                value={profileDraft.teamName}
                onChange={(event) => updateProfileDraftField('teamName', event.target.value)}
                placeholder="Team Name"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <input
                required
                value={profileDraft.leadName}
                onChange={(event) => updateProfileDraftField('leadName', event.target.value)}
                placeholder="Lead Name"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <input
                required
                type="email"
                value={profileDraft.leadEmail}
                onChange={(event) => updateProfileDraftField('leadEmail', event.target.value)}
                placeholder="Lead Email"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <input
                required
                value={profileDraft.leadUsn}
                onChange={(event) => updateProfileDraftField('leadUsn', event.target.value)}
                placeholder="Lead USN"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <input
                required
                value={profileDraft.leadPhone}
                onChange={(event) => updateProfileDraftField('leadPhone', event.target.value)}
                placeholder="Lead Phone"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <select
                required
                value={profileDraft.department}
                onChange={(event) => updateProfileDraftField('department', event.target.value)}
                disabled={lookupLoading}
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">{lookupLoading ? 'Loading departments...' : 'Select department'}</option>
                {lookupOptions.departments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <select
                required
                value={profileDraft.college}
                onChange={(event) => updateProfileDraftField('college', event.target.value)}
                disabled={lookupLoading}
                className="w-full rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">{lookupLoading ? 'Loading colleges...' : 'Select college'}</option>
                {lookupOptions.colleges.map((college) => (
                  <option key={college} value={college}>{college}</option>
                ))}
              </select>
            </div>

            {lookupError ? (
              <div className="mt-3 rounded-lg border border-amber-300/40 bg-amber-900/30 px-3 py-2 text-sm text-amber-100">
                {lookupError}
              </div>
            ) : null}

            <div className="mt-4">
              <MemberFields members={profileMembers} setMembers={setProfileMembers} />
            </div>

            <textarea
              rows={3}
              value={profileDraft.requestNote}
              onChange={(event) => updateProfileDraftField('requestNote', event.target.value)}
              placeholder="Reason for update (optional)"
              className="mt-4 w-full rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
            />

            {profileRequestError ? (
              <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
                {profileRequestError}
              </div>
            ) : null}

            {profileRequestMessage ? (
              <div className="mt-3 rounded-lg border border-emerald-300/40 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-100">
                {profileRequestMessage}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={profileRequestLoading || pendingProfileRequest}
                className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileRequestLoading ? 'Submitting...' : pendingProfileRequest ? 'Request Pending' : 'Submit Update Request'}
              </button>

              {pendingProfileRequest ? (
                <button
                  type="button"
                  onClick={() => setShowRecallDialog(true)}
                  className="rounded-lg border border-rose-300/50 bg-rose-900/30 px-4 py-2 text-sm font-semibold text-rose-100"
                >
                  Recall Pending Request
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        {activeTab === 'password' ? (
          <form onSubmit={handleChangePassword} className="rounded-2xl border border-white/20 bg-white/10 p-6">
            <h2 className="text-xl font-black text-white">Change Password</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <input
                required
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
                placeholder="Current Password"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <input
                required
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => updatePasswordField('newPassword', event.target.value)}
                placeholder="New Password"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
              <input
                required
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
                placeholder="Confirm Password"
                className="rounded-lg border border-white/30 bg-black/25 px-3 py-2 text-slate-100"
              />
            </div>

            {passwordError ? (
              <div className="mt-3 rounded-lg border border-rose-300/40 bg-rose-900/30 px-3 py-2 text-sm text-rose-100">
                {passwordError}
              </div>
            ) : null}

            {passwordMessage ? (
              <div className="mt-3 rounded-lg border border-emerald-300/40 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-100">
                {passwordMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={passwordLoading}
              className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-black text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : null}
      </section>

      <ActionDialog
        isOpen={showRecallDialog}
        title="Recall Update Request"
        message="Do you want to recall the pending profile update request?"
        confirmLabel="Recall Request"
        confirmTone="rose"
        loading={profileRequestLoading}
        onConfirm={handleRecallProfileRequest}
        onCancel={() => setShowRecallDialog(false)}
      />
    </PageShell>
  )
}

export default TeamDashboardPage
