import React, { useEffect, useState } from 'react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@components/shared/ui/dialog'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { Label } from '@components/shared/ui/label'
import { toast } from 'sonner'
import { getMe, updateUsername, updatePassword, uploadProfilePicture, removeProfilePicture, refreshGoogleProfilePicture } from '@api/account/authAPI'
import { useAuth } from '@context/AuthContext'
import type { MeResponse } from '@app-types/auth'
import { UserAvatar } from '@components/shared/UserAvatar'
import GoogleSignInButton from '@components/account/auth/GoogleSignInButton'

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

  const { refreshProfile } = useAuth()
  const [pictureBusy, setPictureBusy] = useState(false)

  const [showGoogleRefetch, setShowGoogleRefetch] = useState(false)

  useEffect(() => {
    if (open) {
      getMe().then((res) => {
        setMe(res)
        setNewUsername(res.username)
      }).catch(() => { })
      setCurrentPassword('')
      setNewPassword('')
    }
  }, [open])

  async function handleGoogleCredential(idToken: string) {
    setPictureBusy(true)
    setShowGoogleRefetch(false)
    const wasAlreadyLinked = me?.hasGoogleAccount
    try {
      await refreshGoogleProfilePicture({ idToken })
      await refreshProfile()
      const refreshedMe = await getMe()
      setMe(refreshedMe)
      toast.success(
        wasAlreadyLinked
          ? 'Profile picture updated from Google'
          : 'Google account linked, email verified, and picture updated'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify with Google')
    } finally {
      setPictureBusy(false)
    }
  }
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
  async function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }

    setPictureBusy(true)
    try {
      await uploadProfilePicture(file)
      await refreshProfile()
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update picture')
    } finally {
      setPictureBusy(false)
      e.target.value = ''
    }
  }

  async function handleRemovePicture() {
    setPictureBusy(true)
    try {
      await removeProfilePicture()
      await refreshProfile()
      toast.success('Profile picture removed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove picture')
    } finally {
      setPictureBusy(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-md" data-testid="account-settings-dialog">
        <DialogHeader>
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <UserAvatar
              username={user?.username ?? ''}
              profilePicture={user?.profilePicture}
              avatarColor={user?.avatarColor ?? '#666'}
              className="h-16 w-16 border border-border"
            />
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer text-xs text-foreground-secondary underline hover:text-foreground">
                {pictureBusy ? 'Uploading...' : 'Upload picture'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePictureChange}
                  disabled={pictureBusy}
                  data-testid="settings-picture-input"
                />
              </label>

              {(
                showGoogleRefetch ? (
                  <GoogleSignInButton onCredential={handleGoogleCredential} />
                ) : (
                  <button
                    onClick={() => setShowGoogleRefetch(true)}
                    className="text-left text-xs text-foreground-secondary underline hover:text-foreground"
                  >
                    {me?.hasGoogleAccount ? 'Use my Google picture' : 'Verify with Google & use picture'}
                  </button>
                )
              )}

              {user?.profilePicture && (
                <button
                  onClick={handleRemovePicture}
                  disabled={pictureBusy}
                  className="text-left text-xs text-muted-foreground hover:text-foreground-secondary"
                >
                  Keep default (remove picture)
                </button>
              )}
            </div>
          </div>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">Account settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUsernameSubmit} className="space-y-3 border-b border-border pb-6">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Username</Label>
          <div className="flex gap-2">
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="border-border bg-card/60 text-foreground-secondary focus-visible:ring-zinc-500"
              data-testid="settings-username-input"
            />
            <Button type="submit" disabled={usernameBusy || newUsername === user?.username} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </Button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
          <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {me?.hasLocalPassword ? 'Change password' : 'Set a password'}
          </Label>

          {!me?.hasGoogleAccount && (
            <Input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
              data-testid="settings-current-password-input"
            />
          )}

          <Input
            type="password"
            placeholder={me?.hasLocalPassword ? 'New password' : 'Choose a password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
            data-testid="settings-new-password-input"
          />

          {!me?.hasLocalPassword && me?.hasGoogleAccount && (
            <p className="text-xs text-muted-foreground">
              Set a password to enable signing in without Google. 
            </p>
          )}
          {me?.hasLocalPassword && me?.hasGoogleAccount && (
            <p className="text-xs text-muted-foreground">
              Set a new password. Google verified, no previous password required. 
            </p>
          )}

          <Button type="submit" disabled={passwordBusy || !newPassword.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {passwordBusy ? 'Saving...' : me?.hasLocalPassword ? 'Update password' : 'Set password'}
          </Button>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}