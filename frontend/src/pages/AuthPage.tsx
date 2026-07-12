import React, { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../context/AuthContext'
import { login, register, loginWithGoogle } from '../api/authAPI'
import GoogleSignInButton from '../components/GoogleSignInButton'

type Mode = 'login' | 'register'

const AuthPage: React.FC = () => {
  const [params] = useSearchParams()
  const initialMode: Mode = params.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const { login: setAuthToken } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setBusy(true)
    try {const response =
  mode === 'login'
    ? await login({ usernameOrEmail: username, password })
    : await register({ username, email, password })

if (response.token) {
  setAuthToken(response.token)
  toast.success(mode === 'login' ? 'Welcome back' : 'Account created')
  navigate('/home')
} else {
  toast.info(response.message ?? 'Check your email to continue')
  setMode('login')
}
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

 async function handleGoogleCredential(idToken: string) {
  setBusy(true)
  try {
    const response = await loginWithGoogle({ idToken })

    if (response.token) {
      setAuthToken(response.token)
      toast.success('Welcome back')
      navigate('/home')
    } else {
      toast.error(response.message ?? 'Google sign-in did not return a token')
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Google sign-in failed')
  } finally {
    setBusy(false)
  }
}
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-10">
          <Link to="/" data-testid="auth-top-logo-link"><Logo size="sm" /></Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900">
              Back to home
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-stretch px-6 py-16">
        <div className="mb-10 text-left">
          <h1 className="font-heading text-4xl font-light tracking-tighter text-zinc-50" data-testid="auth-title">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            {mode === 'login' ? 'Use your username or email to continue.' : 'Set up your workspace in a minute.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
          {mode === 'login' ? (
            <Field label="Username or email">
              <Input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex or alex@ourkanban.dev"
                className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                data-testid="auth-identifier-input"
                autoComplete="username"
              />
            </Field>
          ) : (
            <>
              <Field label="Username">
                <Input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                  data-testid="auth-username-input"
                  autoComplete="username"
                />
              </Field>
              <Field label="Email">
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                  data-testid="auth-email-input"
                  autoComplete="email"
                />
              </Field>
            </>
          )}
          <Field label="Password">
            <Input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
              data-testid="auth-password-input"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </Field>

          <Button type="submit" disabled={busy} className="mt-2 w-full rounded-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-11" data-testid="auth-submit-btn">
            {busy ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          <div className="h-px flex-1 bg-zinc-900" />
          or
          <div className="h-px flex-1 bg-zinc-900" />
        </div>

        <div className="flex justify-center">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          {mode === 'login' ? (
            <>
              New to OurKanban?{' '}
              <button type="button" className="text-zinc-100 underline underline-offset-4 hover:text-white" onClick={() => setMode('register')} data-testid="auth-switch-register">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="text-zinc-100 underline underline-offset-4 hover:text-white" onClick={() => setMode('login')} data-testid="auth-switch-login">
                Sign in
              </button>
            </>
          )}
        </p>
      </main>
    </div>
  )
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</Label>
    {children}
  </div>
)

export default AuthPage