import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { renameProject } from '../api/projectAPI'
import type { ProjectSummary } from '../types/workgroup'

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
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50 sm:max-w-md" data-testid="rename-project-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">Rename project</DialogTitle>
        </DialogHeader>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="border-zinc-800 bg-zinc-900/60 text-zinc-100 focus-visible:ring-zinc-500" data-testid="rename-project-input" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200" data-testid="rename-project-submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}