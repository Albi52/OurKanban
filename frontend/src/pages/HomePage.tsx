import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMyWorkGroups,
  createWorkGroup,
  leaveWorkGroup,
  addMember,
  removeMember,
} from '../api/workGroupAPI'
import { createProject, deleteProject, renameProject } from '../api/projectAPI'
import type { WorkGroup } from '../types/workgroup'
import { useAuth } from '../context/AuthContext'
import './HomePage.css'

export default function HomePage() {
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Create group
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  // Create project
  const [projectFormFor, setProjectFormFor] = useState<number | null>(null)
  const [newProjectName, setNewProjectName] = useState('')

  // Rename project
  const [renamingProjectId, setRenamingProjectId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Manage members
  const [manageMembersFor, setManageMembersFor] = useState<number | null>(null)
  const [newMemberUsername, setNewMemberUsername] = useState('')

  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadWorkGroups()
  }, [])

  async function loadWorkGroups() {
    setLoading(true)
    setError(null)
    try {
      setWorkGroups(await getMyWorkGroups())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  // --- Group handlers ---

  async function handleCreateGroup(e: SubmitEvent) {
    e.preventDefault()
    if (!newGroupName.trim()) return

    setBusy(true)
    setError(null)
    try {
      await createWorkGroup({ name: newGroupName.trim() })
      setNewGroupName('')
      setShowGroupForm(false)
      await loadWorkGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setBusy(false)
    }
  }

  async function handleLeaveGroup(id: number) {
    const confirmed = window.confirm(
      'Leave this group? If you are the last member, it will be permanently deleted.'
    )
    if (!confirmed) return

    setError(null)
    try {
      await leaveWorkGroup(id)
      await loadWorkGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group')
    }
  }

  // --- Project handlers ---

  async function handleCreateProject(workGroupId: number, e: SubmitEvent) {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setBusy(true)
    setError(null)
    try {
      await createProject(workGroupId, { name: newProjectName.trim() })
      setNewProjectName('')
      setProjectFormFor(null)
      await loadWorkGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteProject(projectId: number) {
    const confirmed = window.confirm('Delete this project? This cannot be undone.')
    if (!confirmed) return

    setError(null)
    try {
      await deleteProject(projectId)
      await loadWorkGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  function startRename(projectId: number, currentName: string) {
    setRenamingProjectId(projectId)
    setRenameValue(currentName)
  }

  async function submitRename(e: SubmitEvent) {
    e.preventDefault()
    if (renamingProjectId === null || !renameValue.trim()) return

    setError(null)
    try {
      await renameProject(renamingProjectId, { name: renameValue.trim() })
      setRenamingProjectId(null)
      await loadWorkGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename project')
    }
  }

  // --- Member handlers ---

  async function handleAddMember(workGroupId: number, e: SubmitEvent) {
    e.preventDefault()
    if (!newMemberUsername.trim()) return

    setBusy(true)
    setError(null)
    try {
      await addMember(workGroupId, { username: newMemberUsername.trim() })
      setNewMemberUsername('')
      await loadWorkGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveMember(workGroupId: number, userId: number) {
    const confirmed = window.confirm('Remove this member from the group?')
    if (!confirmed) return

    setError(null)
    try {
      await removeMember(workGroupId, userId)
      await loadWorkGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  const manageMembersGroup =
    manageMembersFor !== null
      ? workGroups.find((g) => g.id === manageMembersFor) ?? null
      : null

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Your workspaces</h1>
        <div>
          <button onClick={() => setShowGroupForm(true)} className="new-group-button">
            + New group
          </button>
          <button onClick={handleLogout} className="logout-button">
            Log out
          </button>
        </div>
      </header>

      {error && <p className="home-error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : workGroups.length === 0 ? (
        <p>You're not part of any group yet. Create one to get started.</p>
      ) : (
        workGroups.map((wg) => (
          <section key={wg.id} className="workgroup-section">
            <div className="workgroup-header">
              <h2>{wg.name}</h2>
              <span className="workgroup-leader">
                Led by {wg.leaderUsername}
                {wg.isLeader ? ' (you)' : ''}
              </span>
              {wg.isLeader ? (
  <button
    onClick={() => setManageMembersFor(wg.id)}
    className="manage-members-button"
  >
    Manage members
  </button>
) : (
  <button
    onClick={() => setManageMembersFor(wg.id)}
    className="manage-members-button"
  >
    Members
  </button>
)}
              <button onClick={() => handleLeaveGroup(wg.id)} className="leave-button">
                Leave group
              </button>
            </div>

            <div className="project-grid">
              {wg.projects.map((p) => (
                <div key={p.id} className="project-card">
                  <div className="project-card-main">
                    {renamingProjectId === p.id ? (
                      <form onSubmit={submitRename} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                          onBlur={() => setRenamingProjectId(null)}
                        />
                      </form>
                    ) : (
                      <h3
                        onClick={() => navigate(`/board/${p.id}`)}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          if (wg.isLeader) startRename(p.id, p.name)
                        }}
                        title={wg.isLeader ? 'Double-click to rename' : undefined}
                      >
                        {p.name}
                      </h3>
                    )}
                  </div>
                  {wg.isLeader && (
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="delete-project-button"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}

              {wg.isLeader && (
                <button
                  className="project-card new-project-card"
                  onClick={() => setProjectFormFor(wg.id)}
                >
                  + New project
                </button>
              )}
            </div>

            {projectFormFor === wg.id && (
              <div className="modal-overlay" onClick={() => setProjectFormFor(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h2>New project in {wg.name}</h2>
                  <form onSubmit={(e) => handleCreateProject(wg.id, e)}>
                    <input
                      type="text"
                      placeholder="Project name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                      autoFocus
                    />
                    <div className="modal-actions">
                      <button type="button" onClick={() => setProjectFormFor(null)}>
                        Cancel
                      </button>
                      <button type="submit" disabled={busy}>
                        {busy ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        ))
      )}

      {showGroupForm && (
        <div className="modal-overlay" onClick={() => setShowGroupForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create a new group</h2>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setShowGroupForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={busy}>
                  {busy ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageMembersGroup && (
  <div className="modal-overlay" onClick={() => setManageMembersFor(null)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h2>Members of {manageMembersGroup.name}</h2>

      <ul className="member-list">
        {manageMembersGroup.members.map((m) => (
          <li key={m.id}>
            {m.username}
            {m.username === manageMembersGroup.leaderUsername ? (
              <span className="member-leader-tag"> (leader)</span>
            ) : manageMembersGroup.isLeader ? (
              <button onClick={() => handleRemoveMember(manageMembersGroup.id, m.id)}>
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {manageMembersGroup.isLeader && (
        <form
          onSubmit={(e) => handleAddMember(manageMembersGroup.id, e)}
          className="add-member-form"
        >
          <input
            type="text"
            placeholder="Username to add"
            value={newMemberUsername}
            onChange={(e) => setNewMemberUsername(e.target.value)}
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      <div className="modal-actions">
        <button type="button" onClick={() => setManageMembersFor(null)}>
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}