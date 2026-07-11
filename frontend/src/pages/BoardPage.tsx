import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject } from '../api/projectAPI'
import type { ProjectSummary } from '../types/workgroup'

export default function BoardPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    getProject(Number(id))
      .then(setProject)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load this project')
      })
  }, [id])

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button onClick={() => navigate('/home')}>Back to home</button>
      </div>
    )
  }

  if (!project) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading...</div>
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>{project.name}</h1>
      <p>The kanban board goes here — coming soon.</p>
    </div>
  )
}