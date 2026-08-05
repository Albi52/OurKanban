import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/shared/ui/dialog'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { toast } from 'sonner'
import { createProject } from '@api/homeManagement/projectAPI'
import type { WorkGroup } from '@app-types/workgroup'

interface Props {
  group: WorkGroup | null
  onClose: () => void
  onCreated: () => void
}

export const CreateProjectDialog: React.FC<Props> = ({ group, onClose, onCreated }) => {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (group) setName('')
  }, [group])

  async function submit() {
    if (!group || !name.trim()) return
    setBusy(true)
    try {
      await createProject(group.id, { name: name.trim() })
      toast.success('Project created')
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!group} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-md" data-testid="create-project-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">New project in {group?.name}</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="border-border bg-card/60 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
          data-testid="create-project-input"
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground">Cancel</Button>
          <Button onClick={submit} disabled={busy || !name.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="create-project-submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}