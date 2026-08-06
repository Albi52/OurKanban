import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@components/shared/Logo'
import { useAuth } from '@context/AuthContext'
import { Button } from '@components/shared/ui/button'
import { UserAvatar } from '@components/shared/UserAvatar'
import { AccountSettingsDialog } from '@components/account/accountSettings/AccountSettingsDialog'
import { ThemeToggle } from '@components/shared/ThemeToggle'
import { ArrowUpRight, LogOut } from 'lucide-react'

export const LandingTopBar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <>
      <nav className="relative z-10 mx-auto flex max-w-[1600px] items-center justify-between px-6 py-8 md:px-12">
               
        <Link to="/" data-testid="top-bar-logo-link" className="shrink-0">
                  <Logo size="md" />
                </Link>

        <div className="flex items-center gap-2 sm:gap-3">
                 <ThemeToggle />
          {user ? (
            <>
              <button
                onClick={() => setSettingsOpen(true)}
                className="hidden items-center gap-2 rounded-md px-1.5 py-1 text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground sm:flex sm:px-2"
                data-testid="landing-account-trigger"
                aria-label="Account settings"
              >
                <UserAvatar
                  username={user.username}
                  profilePicture={user.profilePicture}
                  avatarColor={user.avatarColor}
                  className="h-8 w-8 border border-border"
                />

                <span className="text-sm" data-testid="landing-username">
                  {user.username}
                </span>
              </button>

  

              <Link to="/home">
                <Button
                  className="rounded-full bg-zinc-50 px-4 text-zinc-950 hover:bg-primary/90 sm:px-5"
                  data-testid="landing-go-home-btn"
                >
                  Go to home
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground"
                data-testid="landing-logout-btn"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </>
          ) : (
            <>
              

              <Link to="/login">
                <Button
                  className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                  data-testid="landing-signin-btn"
                >
                  Sign in
                </Button>
              </Link>

              <Link to="/login?mode=register">
                <Button
                  variant="ghost"
                  className="text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground"
                  data-testid="landing-register-btn"
                >
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}