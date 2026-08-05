import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/shared/ui/dialog'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { toast } from 'sonner'
import { renameProject } from '@api/homeManagement/projectAPI'
import type { ProjectSummary } from '@app-types/workgroup'

interface Props {
  project: ProjectSummary
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
}

export const RenameProjectDialog: React.FC<Props> = ({ project, open, onOpenChange, onDone }) => {
  const [name, setName] = useState(project.name)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setName(project.name)
  }, [open, project.name])

  async function submit() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await renameProject(project.id, { name: name.trim() })
      toast.success('Project renamed')
      onOpenChange(false)
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-md" data-testid="rename-project-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">Rename project</DialogTitle>
        </DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="border-border bg-card/60 text-foreground-secondary focus-visible:ring-zinc-500" data-testid="rename-project-input" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-primary text-primary-foreground hover:bg-zinc-200" data-testid="rename-project-submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}