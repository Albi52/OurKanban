import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { useAuth } from '../context/AuthContext'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { LogOut } from 'lucide-react'

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-xl" data-testid="top-bar">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-10">
        <Link to={user ? '/home' : '/'} data-testid="top-bar-logo-link">
          <Logo size="sm" />
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <Avatar className="h-8 w-8 border border-zinc-800">
                <AvatarFallback className="text-xs font-medium text-zinc-950" style={{ background: user.avatarColor }}>
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-300" data-testid="top-bar-username">{user.username}</span>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900" onClick={handleLogout} data-testid="top-bar-logout-btn">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}