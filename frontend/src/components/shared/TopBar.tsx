import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@components/shared/Logo'
import { useAuth } from '@context/AuthContext'
import { Button } from '@components/shared/ui/button'
import { UserAvatar } from '@components/shared/UserAvatar'
import { AccountSettingsDialog } from '@components/account/accountSettings/AccountSettingsDialog'
import { ThemeToggle } from '@components/shared/ThemeToggle'
import { LogOut } from 'lucide-react'

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/70 backdrop-blur-xl" data-testid="top-bar">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 md:px-10">
        <Link to="/" data-testid="top-bar-logo-link" className="shrink-0">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent hover:text-accent-foreground sm:px-2"
              data-testid="top-bar-account-trigger"
              aria-label="Account settings"
            >
              <UserAvatar
                username={user.username}
                profilePicture={user.profilePicture}
                avatarColor={user.avatarColor}
                className="h-8 w-8 border border-border"
              />
              <span className="hidden text-sm text-foreground-secondary md:inline" data-testid="top-bar-username">
                {user.username}
              </span>
            </button>

            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground sm:px-3"
              onClick={handleLogout}
              data-testid="top-bar-logout-btn"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        )}
      </div>
      </div>

      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  )
}