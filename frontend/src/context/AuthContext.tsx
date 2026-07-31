import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { TOKEN_STORAGE_KEY } from '@/constants'
import { decodeToken } from '@lib/jwt'
import { usernameToColor } from '@lib/avatarColor'
import { getMe } from '@api/account/authAPI'
import { registerUnauthorizedHandler } from '@api/account/authEvents'
import { toast } from 'sonner'

interface AuthUser {
  username: string
  avatarColor: string
  profilePicture?: string | null
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void

  refreshProfile: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [token])

  useEffect(() => {
  registerUnauthorizedHandler(() => {
    setToken(null)
    toast.error('Your session has expired. Please log in again.')
  })
}, [])
  const baseUser = useMemo(() => {
    if (!token) return null
    const decoded = decodeToken(token)
    if (!decoded) return null
    return { username: decoded.username, avatarColor: usernameToColor(decoded.username) }
  }, [token])

  useEffect(() => {
  registerUnauthorizedHandler(() => {
    setToken(null)
  })
}, [])

  useEffect(() => {
    if (!token) {
      setProfilePicture(null)
      return
    }
    getMe()
      .then((me) => setProfilePicture(me.profilePicture))
      .catch(() => setProfilePicture(null))
  }, [token])

  const user: AuthUser | null = baseUser ? { ...baseUser, profilePicture } : null

  const login = (newToken: string) => setToken(newToken)
  const logout = () => setToken(null)

  async function refreshProfile() {
    if (!token) return
    const me = await getMe()
    setProfilePicture(me.profilePicture)
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
