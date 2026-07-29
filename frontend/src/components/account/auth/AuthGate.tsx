import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PUBLIC_PATHS = ['/', '/login', '/privacy', '/terms', '/verify-email']

export function AuthGate() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const wasAuthenticated = useRef(isAuthenticated)

  useEffect(() => {
    const justLoggedOut = wasAuthenticated.current && !isAuthenticated
    wasAuthenticated.current = isAuthenticated

    if (justLoggedOut && !PUBLIC_PATHS.includes(location.pathname)) {
      navigate('/login')
    }
  }, [isAuthenticated, location.pathname, navigate])

  return null
}