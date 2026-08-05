import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/shared/ui/dialog'
import { Button } from '@components/shared/ui/button'
import { toast } from 'sonner'
import { deleteProject } from '@api/homeManagement/projectAPI'
import type { ProjectSummary } from '@app-types/workgroup'

interface Props {
  project: ProjectSummary
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone: () => void
}

export const DeleteProjectDialog: React.FC<Props> = ({ project, open, onOpenChange, onDone }) => {
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await deleteProject(project.id)
      toast.success('Project deleted')
      onOpenChange(false)
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-md" data-testid="delete-project-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">Delete project</DialogTitle>
          <DialogDescription className="text-foreground0">
            Delete <span className="text-foreground-secondary">{project.name}</span>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-red-500 text-foreground hover:bg-red-600" data-testid="delete-project-confirm">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}