import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../../../components/shared/ui/input'
import { toast } from 'sonner'
import { addMember, removeMember } from '../../../api/homeManagement/workGroupAPI'
import { usernameToColor } from '../../../lib/avatarColor'
import type { WorkGroup } from '../../../types/workgroup'
import { X, UserPlus, Crown } from 'lucide-react'
import { UserAvatar } from '../../shared/UserAvatar'

import { searchUsers } from '../../../api/account/userAPI'
import type { UserSearchResult } from '../../../types/user'

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
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50 sm:max-w-lg" data-testid="participants-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">{group.name}</DialogTitle>
          <DialogDescription className="text-zinc-500">
            {group.members.length} participant{group.members.length === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  username={m.username}
                  profilePicture={m.profilePicture}
                  avatarColor={usernameToColor(m.username)}
                  className="h-8 w-8 border border-zinc-800"
                />

                <span className="flex items-center text-sm text-zinc-100">
                  {m.username}

                  {m.username === group.leaderUsername && (
                    <Crown className="ml-1 h-3.5 w-3.5 text-amber-400" />
                  )}
                </span>
              </div>

              {group.isLeader && m.username !== group.leaderUsername && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(m.id)}
                  className="h-8 w-8 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>

        {group.isLeader && (
          <div className="mt-4 space-y-2 border-t border-zinc-900 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Add member</p>
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
                className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                data-testid="participant-add-input"
                autoComplete="off"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(s.username)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-900"
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
              <Button onClick={handleAdd} disabled={busy} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200" data-testid="participant-add-btn">
                <UserPlus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50" data-testid="participants-close-btn">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}