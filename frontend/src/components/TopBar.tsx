import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { UserAvatar } from './UserAvatar'
import { AccountSettingsDialog } from './AccountSettingsDialog'
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-xl" data-testid="top-bar">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 md:px-10">
        <Link to="/" data-testid="top-bar-logo-link" className="shrink-0">
          <Logo size="sm" />
        </Link>

        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-zinc-900 sm:px-2"
              data-testid="top-bar-account-trigger"
              aria-label="Account settings"
            >
              <UserAvatar
                username={user.username}
                profilePicture={user.profilePicture}
                avatarColor={user.avatarColor}
                className="h-8 w-8 border border-zinc-800"
              />
              <span className="hidden text-sm text-zinc-300 md:inline" data-testid="top-bar-username">
                {user.username}
              </span>
            </button>

            <Button
              variant="ghost"
              size="sm"
              className="px-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 sm:px-3"
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

      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  )
}