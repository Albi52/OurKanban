import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@components/shared/Logo'
import { Button } from '@components/shared/ui/button'
import { ArrowUpRight, LogOut } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { UserAvatar } from '@components/shared/UserAvatar'

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl" />

      <nav className="relative z-10 mx-auto flex max-w-[1600px] items-center justify-between px-6 py-8 md:px-12">
        <Logo size="md" />

        {user ? (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <UserAvatar
                username={user.username}
                profilePicture={user.profilePicture}
                avatarColor={user.avatarColor}
                className="h-8 w-8 border border-border"
              />
              <span className="text-sm text-foreground-secondary" data-testid="nav-username">{user.username}</span>
            </div>

            <Link to="/home">
              <Button className="rounded-full bg-zinc-50 px-4 text-zinc-950 hover:bg-primary/90 sm:px-5" data-testid="nav-go-home-btn">
                Go to home
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground"
              data-testid="nav-logout-btn"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5" data-testid="nav-register-btn">
                Sign in
              </Button>
            </Link>
            <Link to="/login?mode=register">
              <Button variant="ghost" className="text-foreground-secondary hover:text-foreground hover:bg-accent hover:text-accent-foreground" data-testid="nav-signin-btn">
                Register
              </Button>
            </Link>
          </div>
        )}
      </nav>

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-start justify-center px-6 py-24 md:px-12 md:py-32">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-zinc-900/50 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Collaborative Kanban
        </span>

        <h1
          className="font-heading text-5xl font-light leading-[0.95] tracking-tighter text-foreground xs:text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]"
          data-testid="landing-title"
        >
          Our<span className="font-medium">Kanban</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-10 sm:text-lg md:text-xl">
          A quiet workspace for working groups. Organize projects, run the board, keep a calendar — without the noise.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-12">
          {user ? (
            <Link to="/home">
              <Button size="lg" className="h-12 rounded-full bg-zinc-50 px-6 text-base text-zinc-950 transition-transform hover:-translate-y-0.5 hover:bg-primary/90 sm:px-8" data-testid="hero-go-home-btn">
                Go to your workspace
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg" className="h-12 rounded-full bg-zinc-50 px-6 text-base text-zinc-950 transition-transform hover:-translate-y-0.5 hover:bg-primary/90 sm:px-8" data-testid="hero-signin-btn">
                  Sign in
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login?mode=register">
                <Button size="lg" variant="outline" className="h-12 rounded-full border-border-hover bg-transparent px-6 text-base text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground sm:px-8" data-testid="hero-register-btn">
                  Create account
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-lg font-medium text-foreground-secondary">
              Workgroups
            </h3>
            <p className="mt-3 text-muted-foreground">
              Create collaborative workspaces and invite members to work together.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-lg font-medium text-foreground-secondary">
              Project Management
            </h3>
            <p className="mt-3 text-muted-foreground">
              Organize multiple projects, define responsibilities and track progress.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-lg font-medium text-foreground-secondary">
              Kanban Boards
            </h3>
            <p className="mt-3 text-muted-foreground">
              Visualize workflows and move tasks across customizable columns.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-lg font-medium text-foreground-secondary">
              Task Assignment
            </h3>
            <p className="mt-3 text-muted-foreground">
              Assign work, monitor deadlines and keep everyone aligned.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-lg font-medium text-foreground-secondary">
              Shared Calendar
            </h3>
            <p className="mt-3 text-muted-foreground">
              Schedule events and coordinate important milestones with your team.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-6">
            <h3 className="text-lg font-medium text-foreground-secondary">
              Secure Authentication
            </h3>
            <p className="mt-3 text-muted-foreground">
              Sign in securely using Google or email authentication.
            </p>
          </div>

        </div>

      </main>

      <footer className="relative z-10 mx-auto max-w-[1600px] px-4 py-8 text-xs uppercase tracking-[0.2em] text-muted-foreground-subtle sm:px-6 sm:py-10 md:px-12">
        &copy; 2026 OurKanban · A minimalist workspace
        <span className="mx-3">·</span>
        <Link to="/privacy" className="hover:text-foreground-secondary">Privacy</Link>
        <span className="mx-3">·</span>
        <Link to="/terms" className="hover:text-foreground-secondary">Terms</Link>
      </footer>
    </div>
  )
}

export default LandingPage