import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/shared/ui/dialog'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { toast } from 'sonner'
import { addMember, removeMember } from '@api/homeManagement/workGroupAPI'
import { usernameToColor } from '@lib/avatarColor'
import type { WorkGroup } from '@app-types/workgroup'
import { X, UserPlus, Crown } from 'lucide-react'
import { UserAvatar } from '@components/shared/UserAvatar'

import { searchUsers } from '@api/account/userAPI'
import type { UserSearchResult } from '@app-types/user'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  group: WorkGroup
  onChanged: () => void
}

export const ParticipantsDialog: React.FC<Props> = ({ open, onOpenChange, group, onChanged }) => {
  const [newUsername, setNewUsername] = useState('')
  const [busy, setBusy] = useState(false)

  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (newUsername.trim().length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(newUsername.trim())
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [newUsername])

  function selectSuggestion(username: string) {
    setNewUsername(username)
    setSuggestions([])
    setShowSuggestions(false)
  }

  async function handleAdd() {
    if (!newUsername.trim()) return
    setBusy(true)
    try {
      await addMember(group.id, { username: newUsername.trim() })
      setNewUsername('')
      setSuggestions([])
      toast.success('Member added')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(userId: number) {
    try {
      await removeMember(group.id, userId)
      toast.success('Member removed')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-lg" data-testid="participants-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">{group.name}</DialogTitle>
          <DialogDescription className="text-foreground0">
            {group.members.length} participant{group.members.length === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-md border border-border bg-card/40 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  username={m.username}
                  profilePicture={m.profilePicture}
                  avatarColor={usernameToColor(m.username)}
                  className="h-8 w-8 border border-border"
                />

                <span className="flex items-center text-sm text-foreground-secondary">
                  {m.username}

                  {m.username === group.leaderUsername && (
                    <Crown className="ml-1 h-3.5 w-3.5 text-warning" />
                  )}
                </span>
              </div>

              {group.isLeader && m.username !== group.leaderUsername && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(m.id)}
                  className="h-8 w-8 text-foreground0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>

        {group.isLeader && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground0">Add member</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
              <Input
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Start typing a username..."
                className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
                data-testid="participant-add-input"
                autoComplete="off"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(s.username)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground-secondary hover:bg-accent hover:text-accent-foreground"
                        data-testid={`user-suggestion-${s.id}`}
                      >
                        <UserAvatar
                          username={s.username}
                          profilePicture={s.profilePicture}
                          avatarColor={usernameToColor(s.username)}
                          className="h-6 w-6"
                        />
                        {s.username}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              </div>
              <Button onClick={handleAdd} disabled={busy} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="participant-add-btn">
                <UserPlus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground" data-testid="participants-close-btn">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}