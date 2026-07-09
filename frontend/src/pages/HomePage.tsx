import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>Welcome to your board</h1>
      <p>This is a placeholder home page — boards and cards coming soon.</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  )
}