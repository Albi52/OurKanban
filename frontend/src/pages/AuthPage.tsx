import { useState } from 'react'
import type { SubmitEvent  } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, loginWithGoogle } from '../api/authAPI'
import { useAuth } from '../context/AuthContext'
import GoogleSignInButton from '../components/GoogleSignInButton'
import './AuthPage.css'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login: setAuthToken } = useAuth()
  const navigate = useNavigate()

  function resetFields() {
    setUsername('')
    setEmail('')
    setPassword('')
    setError(null)
  }

  function switchMode(newMode: Mode) {
    setMode(newMode)
    resetFields()
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response =
        mode === 'login'
          ? await login({ usernameOrEmail: username, password })
          : await register({ username, email, password })

      setAuthToken(response.token)
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : `${mode} failed`)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setError(null)
    setLoading(true)
    try {
      const response = await loginWithGoogle({ idToken })
      setAuthToken(response.token)
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'login' ? (
            <input
              type="text"
              placeholder="Username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          ) : (
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-button-wrapper">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button type="button" onClick={() => switchMode('register')}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}