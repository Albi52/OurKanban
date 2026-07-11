import { useParams } from 'react-router-dom'

export default function BoardPage() {
  const { id } = useParams()
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>Board for project #{id}</h1>
      <p>The kanban board goes here — coming soon.</p>
    </div>
  )
}