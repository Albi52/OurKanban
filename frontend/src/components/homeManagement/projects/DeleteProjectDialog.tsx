import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { toast } from 'sonner'
import { deleteProject } from '../api/projectAPI'
import type { ProjectSummary } from '../types/workgroup'

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
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50 sm:max-w-md" data-testid="delete-project-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">Delete project</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Delete <span className="text-zinc-200">{project.name}</span>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-red-500 text-zinc-50 hover:bg-red-600" data-testid="delete-project-confirm">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}