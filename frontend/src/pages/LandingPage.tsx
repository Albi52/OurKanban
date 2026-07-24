import React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/button'
import { ArrowUpRight } from 'lucide-react'

const LandingPage: React.FC = () => (
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
    </nav>

    <main className="relative z-10 mx-auto flex max-w-[1400px] flex-col items-start justify-center px-6 py-24 md:px-12 md:py-32">


      <h1 className="font-heading text-6xl font-light leading-[0.9] tracking-tighter text-zinc-50 sm:text-7xl md:text-8xl lg:text-[9rem]" data-testid="landing-title">
        OurKanban
      </h1>


      <p className="mt-10 max-w-xl text-lg leading-relaxed text-zinc-400 md:text-xl">
        OurKanban is a collaborative project management platform that helps teams
  organize projects, manage Kanban boards, assign tasks, schedule events,
  and work together in real time. 
      </p>

      <div className="mt-12 flex flex-wrap items-center gap-3">
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
      </div>
    </main>


      <footer className="relative z-10 mx-auto max-w-[1600px] px-6 py-10 text-xs uppercase tracking-[0.2em] text-zinc-600 md:px-12">
  &copy; 2026 OurKanban · A minimalist workspace · © 2026 TwinChain Studios · All rights reserved.
  <span className="mx-3">·</span>
  <Link to="/privacy" className="hover:text-zinc-300">Privacy</Link>
  <span className="mx-3">·</span>
  <Link to="/terms" className="hover:text-zinc-300">Terms</Link>
    </footer>

  </div>
)

export default LandingPage