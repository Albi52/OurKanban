import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@components/shared/ui/button'
import { Home, RefreshCw } from 'lucide-react'
import { LandingTopBar } from '@/components/shared/LandingTopBar'

interface ErrorPageProps {
  statusCode?: number
  title?: string
  message?: string
  detail?: string
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  statusCode = 500,
  title = 'Something went wrong',
  message = "An unexpected error interrupted this page. It's not you — it's us.",
  detail,
}) => {
  const navigate = useNavigate()

  const statusLabel = String(statusCode)
  const isNotFound = statusCode === 404

  function handleRetry() {
    navigate(0)
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
    
      <LandingTopBar />

      <main className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-start justify-center px-6 py-24 md:px-12 md:py-32">
        <span className="mb-6 inline-flex items-center gap-3 rounded-full border border-border bg-zinc-900/50 px-5 py-2 text-sm uppercase tracking-[0.2em] text-muted-foreground sm:mb-8"> 
        <span
            className={`h-3 w-3 rounded-full ${
              isNotFound ? 'bg-warning' : 'bg-destructive'
            }`}
          />
          {isNotFound ? '404' : `Error ${statusLabel}`}
        </span>

        <h1
          className="font-heading text-5xl font-light leading-[0.95] tracking-tighter text-foreground xs:text-6xl sm:text-7xl md:text-8xl lg:text-[8rem]"
          data-testid="error-title"
        >
          {title}
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:mt-10 sm:text-lg md:text-xl">
          {message}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-12">
          <Link to="/">
            <Button
              size="lg"
              className="h-12 rounded-full bg-zinc-50 px-6 text-base text-zinc-950 transition-transform hover:-translate-y-0.5 hover:bg-primary/90 sm:px-8"
              data-testid="error-home-btn"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Button>
          </Link>

          <Button
            size="lg"
            variant="outline"
            onClick={handleRetry}
            className="h-12 rounded-full border-border-hover bg-transparent px-6 text-base text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground sm:px-8"
            data-testid="error-retry-btn"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>

        {import.meta.env.DEV && detail && (
          <details className="mt-12 w-full max-w-2xl rounded-2xl border border-border bg-card/40 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-muted-foreground-subtle">
              Error details (dev only)
            </summary>

            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
              {detail}
            </pre>
          </details>
        )}
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-8 text-xs uppercase tracking-[0.2em] text-muted-foreground-subtle sm:px-6 sm:py-10 md:px-12">
        &copy; 2026 OurKanban · A minimalist workspace
      </footer>
    </div>
  )
}

export default ErrorPage