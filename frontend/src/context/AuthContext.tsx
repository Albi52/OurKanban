import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { TOKEN_STORAGE_KEY } from '../constants'
import { decodeToken } from '../lib/jwt'
import { usernameToColor } from '../lib/avatarColor'

interface AuthUser {
  username: string
  avatarColor: string
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [token])

  const user = useMemo<AuthUser | null>(() => {
    if (!token) return null
    const decoded = decodeToken(token)
    if (!decoded) return null
    return { username: decoded.username, avatarColor: usernameToColor(decoded.username) }
  }, [token])

  const login = (newToken: string) => setToken(newToken)
  const logout = () => setToken(null)

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}