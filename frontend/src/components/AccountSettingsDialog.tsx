import React, { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { toast } from 'sonner'
import { getMe, updateUsername, updatePassword } from '../api/authAPI'
import { useAuth } from '../context/AuthContext'
import type { MeResponse } from '../types/auth'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export const AccountSettingsDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { login: setAuthToken, user } = useAuth()
  const [me, setMe] = useState<MeResponse | null>(null)

  const [newUsername, setNewUsername] = useState('')
  const [usernameBusy, setUsernameBusy] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)

  useEffect(() => {
    if (open) {
      getMe().then((res) => {
        setMe(res)
        setNewUsername(res.username)
      }).catch(() => {})
      setCurrentPassword('')
      setNewPassword('')
    }
  }, [open])

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newUsername.trim() || newUsername === user?.username) return

    setUsernameBusy(true)
    try {
      const res = await updateUsername({ newUsername: newUsername.trim() })
      if (res.token) setAuthToken(res.token)
      toast.success('Username updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update username')
    } finally {
      setUsernameBusy(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword.trim()) return

    setPasswordBusy(true)
    try {
      const res = await updatePassword({
        currentPassword: me?.hasLocalPassword ? currentPassword : null,
        newPassword: newPassword.trim(),
      })
      if (res.token) {
        setAuthToken(res.token)
        toast.success(res.message ?? 'Password updated')
      } else {
        toast.info(res.message ?? 'Check your email to verify your new password')
      }
      setCurrentPassword('')
      setNewPassword('')
      const refreshed = await getMe()
      setMe(refreshed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50 sm:max-w-md" data-testid="account-settings-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">Account settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUsernameSubmit} className="space-y-3 border-b border-zinc-900 pb-6">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Username</Label>
          <div className="flex gap-2">
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="border-zinc-800 bg-zinc-900/60 text-zinc-100 focus-visible:ring-zinc-500"
              data-testid="settings-username-input"
            />
            <Button type="submit" disabled={usernameBusy || newUsername === user?.username} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
              Save
            </Button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {me?.hasLocalPassword ? 'Change password' : 'Set a password'}
          </Label>

          {me?.hasLocalPassword && (
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
              data-testid="settings-current-password-input"
            />
          )}

          <Input
            type="password"
            placeholder={me?.hasLocalPassword ? 'New password' : 'Choose a password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
            data-testid="settings-new-password-input"
          />

          {!me?.hasLocalPassword && (
            <p className="text-xs text-zinc-500">
              You signed in with Google and haven't set a password yet. Setting one will require email verification before it works.
            </p>
          )}

          <Button type="submit" disabled={passwordBusy || !newPassword.trim()} className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
            {passwordBusy ? 'Saving...' : me?.hasLocalPassword ? 'Update password' : 'Set password'}
          </Button>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}