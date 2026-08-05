import React, { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@components/shared/Logo'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { Label } from '@components/shared/ui/label'
import { useAuth } from '@context/AuthContext'
import { login, register, loginWithGoogle } from '@api/account/authAPI'
import GoogleSignInButton from '@components/account/auth/GoogleSignInButton'

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
  
const [confirmPassword, setConfirmPassword] = useState('')
const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()


    if (mode === 'register' && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      const response =
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-10">
          <Link to="/" data-testid="auth-top-logo-link"><Logo size="sm" /></Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent hover:text-accent-foreground">
              Back to home
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-stretch px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-10 text-left">
          <h1 className="font-heading text-4xl font-light tracking-tighter text-foreground" data-testid="auth-title">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-3 text-sm text-foreground0">
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
                className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
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
                  className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
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
                  className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
                  data-testid="auth-email-input"
                  autoComplete="email"
                />
              </Field>
            </>
          )}
          <Field label="Password">
            <div className="relative">
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500 pr-10"
                data-testid="auth-password-input"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground0 hover:text-foreground-secondary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-testid="auth-password-toggle"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {mode === 'register' && (
            <Field label="Confirm password">
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
                data-testid="auth-confirm-password-input"
                autoComplete="new-password"
              />
            </Field>
          )}

          <Button type="submit" disabled={busy} className="mt-2 w-full rounded-full bg-primary text-primary-foreground hover:bg-zinc-200 h-11" data-testid="auth-submit-btn">
            {busy ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground-subtle">
          <div className="h-px flex-1 bg-zinc-900" />
          or
          <div className="h-px flex-1 bg-zinc-900" />
        </div>

        <div className="flex justify-center">
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </div>

        <p className="mt-10 text-sm text-foreground0">
          {mode === 'login' ? (
            <>
              New to OurKanban?{' '}
              <button type="button" className="text-foreground-secondary underline underline-offset-4 hover:text-white" onClick={
                () => {
                  setMode('register')
                  setConfirmPassword('')
                }
              } data-testid="auth-switch-register">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="text-foreground-secondary underline underline-offset-4 hover:text-white" onClick={() => {
                setMode('login')
                setConfirmPassword('')
              }} data-testid="auth-switch-login">
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
    <Label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground0">{label}</Label>
    {children}
  </div>
)

export default AuthPage