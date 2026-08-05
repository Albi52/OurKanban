import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/shared/ui/dialog'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { toast } from 'sonner'
import { createWorkGroup } from '@api/homeManagement/workGroupAPI'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

export const CreateGroupDialog: React.FC<Props> = ({ open, onOpenChange, onCreated }) => {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await createWorkGroup({ name: name.trim() })
      toast.success('Group created')
      setName('')
      onOpenChange(false)
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-md" data-testid="create-group-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">New working group</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
          data-testid="create-group-input"
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground">Cancel</Button>
          <Button onClick={submit} disabled={busy || !name.trim()} className="bg-primary text-primary-foreground hover:bg-zinc-200" data-testid="create-group-submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}