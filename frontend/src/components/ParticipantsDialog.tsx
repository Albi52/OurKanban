import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { toast } from 'sonner'
import { addMember, removeMember } from '../api/workGroupAPI'
import { usernameToColor } from '../lib/avatarColor'
import type { WorkGroup } from '../types/workgroup'
import { Crown, X, UserPlus } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  group: WorkGroup
  onChanged: () => void
}

export const ParticipantsDialog: React.FC<Props> = ({ open, onOpenChange, group, onChanged }) => {
  const [newUsername, setNewUsername] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!newUsername.trim()) return
    setBusy(true)
    try {
      await addMember(group.id, { username: newUsername.trim() })
      setNewUsername('')
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

        <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
          {group.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2" data-testid={`participant-${m.id}`}>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-8 w-8 border border-zinc-800">
                  <AvatarFallback className="text-[11px] font-medium text-zinc-950" style={{ background: usernameToColor(m.username) }}>
                    {m.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="truncate text-sm text-zinc-100">
                  {m.username}
                  {m.username === group.leaderUsername && <Crown className="ml-1 inline h-3 w-3 text-amber-400" />}
                </p>
              </div>
              {group.isLeader && m.username !== group.leaderUsername && (
                <button onClick={() => handleRemove(m.id)} className="rounded-md p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-300" data-testid={`remove-participant-${m.id}`} aria-label="Remove participant">
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>

        {group.isLeader && (
          <div className="mt-4 space-y-2 border-t border-zinc-900 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Add member</p>
            <div className="flex gap-2">
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="username"
                className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                data-testid="participant-add-input"
              />
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
    </Dialog>
  )
}