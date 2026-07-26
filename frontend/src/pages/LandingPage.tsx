import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { ArrowUpRight, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden">
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
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar className="h-8 w-8 border border-zinc-800">
                <AvatarFallback className="text-xs font-medium text-zinc-950" style={{ background: user.avatarColor }}>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-300" data-testid="nav-username">{user.username}</span>
            </div>

            <Link to="/home">
              <Button className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 rounded-full px-5" data-testid="nav-go-home-btn">
                Go to home
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900"
              data-testid="nav-logout-btn"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900" data-testid="nav-signin-btn">
                Sign in
              </Button>
            </Link>
            <Link to="/login?mode=register">
              <Button className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 rounded-full px-5" data-testid="nav-register-btn">
                Register
              </Button>
            </Link>
          </div>
        )}
      </nav>

      <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-start justify-center px-6 py-24 md:px-12 md:py-32">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Collaborative Kanban
        </span>

        <h1 className="font-heading text-6xl font-light leading-[0.9] tracking-tighter text-zinc-50 sm:text-7xl md:text-8xl lg:text-[9rem]" data-testid="landing-title">
          Our<span className="font-medium">Kanban</span>
        </h1>

        <p className="mt-10 max-w-xl text-lg leading-relaxed text-zinc-400 md:text-xl">
          A quiet workspace for working groups. Organize projects, run the board, keep a calendar — without the noise.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          {user ? (
            <Link to="/home">
              <Button size="lg" className="rounded-full bg-zinc-50 px-8 text-zinc-950 hover:bg-zinc-200 h-12 text-base transition-transform hover:-translate-y-0.5" data-testid="hero-go-home-btn">
                Go to your workspace
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg" className="rounded-full bg-zinc-50 px-8 text-zinc-950 hover:bg-zinc-200 h-12 text-base transition-transform hover:-translate-y-0.5" data-testid="hero-signin-btn">
                  Sign in
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login?mode=register">
                <Button size="lg" variant="outline" className="rounded-full border-zinc-700 bg-transparent px-8 text-zinc-100 hover:bg-zinc-900 hover:text-zinc-50 h-12 text-base" data-testid="hero-register-btn">
                  Create account
                </Button>
              </Link>
            </>
          )}
        </div>
        
  <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-lg font-medium text-zinc-100">
        Workgroups
      </h3>
      <p className="mt-3 text-zinc-400">
        Create collaborative workspaces and invite members to work together.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-lg font-medium text-zinc-100">
        Project Management
      </h3>
      <p className="mt-3 text-zinc-400">
        Organize multiple projects, define responsibilities and track progress.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-lg font-medium text-zinc-100">
        Kanban Boards
      </h3>
      <p className="mt-3 text-zinc-400">
        Visualize workflows and move tasks across customizable columns.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-lg font-medium text-zinc-100">
        Task Assignment
      </h3>
      <p className="mt-3 text-zinc-400">
        Assign work, monitor deadlines and keep everyone aligned.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-lg font-medium text-zinc-100">
        Shared Calendar
      </h3>
      <p className="mt-3 text-zinc-400">
        Schedule events and coordinate important milestones with your team.
      </p>
    </div>

    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <h3 className="text-lg font-medium text-zinc-100">
        Secure Authentication
      </h3>
      <p className="mt-3 text-zinc-400">
        Sign in securely using Google or email authentication.
      </p>
    </div>

  </div>

      </main>

      <footer className="relative z-10 mx-auto max-w-[1600px] px-6 py-10 text-xs uppercase tracking-[0.2em] text-zinc-600 md:px-12">
        &copy; 2026 OurKanban · A minimalist workspace
        <span className="mx-3">·</span>
        <Link to="/privacy" className="hover:text-zinc-300">Privacy</Link>
        <span className="mx-3">·</span>
        <Link to="/terms" className="hover:text-zinc-300">Terms</Link>
      </footer>
    </div>
  )
}

export default LandingPage