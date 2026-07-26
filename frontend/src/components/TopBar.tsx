import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { LogOut } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { AccountSettingsDialog } from './AccountSettingsDialog'

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
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-10">
        <Link to="/" data-testid="top-bar-logo-link">
          <Logo size="sm" />
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSettingsOpen(true)}
              className="hidden items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-900 md:flex"
              data-testid="top-bar-account-trigger"
            >
              <UserAvatar
                username={user.username}
                profilePicture={user.profilePicture}
                avatarColor={user.avatarColor}
                className="h-8 w-8 border border-zinc-800"
              />
              <span className="text-sm text-zinc-300" data-testid="top-bar-username">{user.username}</span>
            </button>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900" onClick={handleLogout} data-testid="top-bar-logout-btn">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}
      </div>
      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  )
}