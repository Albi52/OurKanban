import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import { createProject } from '../api/projectAPI'
import type { WorkGroup } from '../types/workgroup'

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
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50 sm:max-w-md" data-testid="create-project-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-medium tracking-tight">New project in {group?.name}</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
          data-testid="create-project-input"
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50">Cancel</Button>
          <Button onClick={submit} disabled={busy || !name.trim()} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200" data-testid="create-project-submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}