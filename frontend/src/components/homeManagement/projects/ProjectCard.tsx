import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectSummary } from '@app-types/workgroup'
import { MoreHorizontal, ArrowUpRight } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/shared/ui/dropdown-menu'
import { RenameProjectDialog } from '@components/homeManagement/projects/RenameProjectDialog'
import { DeleteProjectDialog } from '@components/homeManagement/projects/DeleteProjectDialog'

interface Props {
  project: ProjectSummary
  canManage: boolean
  onChanged: () => void
}

export const ProjectCard: React.FC<Props> = ({ project, canManage, onChanged }) => {
  const navigate = useNavigate()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div
        className="group relative flex h-40 flex-col justify-between rounded-xl border border-border bg-card/40 p-5 transition-transform transition-colors duration-200 ease-out hover:-translate-y-1 hover:border-border-hover"
        data-testid={`project-card-${project.id}`}
      >
        {canManage && (
          <div className="absolute right-3 top-3 opacity-70 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground"
                  data-testid={`project-menu-${project.id}`}
                  aria-label="Project actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-border bg-background text-foreground-secondary">
                <DropdownMenuItem onClick={() => setRenameOpen(true)} data-testid={`project-rename-${project.id}`} className="focus:bg-zinc-900 focus:text-foreground">
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} data-testid={`project-delete-${project.id}`} className="text-red-400 focus:bg-red-500/10 focus:text-red-300">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <button type="button" onClick={() => navigate(`/board/${project.id}`)} className="text-left" data-testid={`project-open-${project.id}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground0">Project</p>
          <h3 className="mt-2 font-heading text-xl font-medium tracking-tight text-foreground">{project.name}</h3>
        </button>

        <button onClick={() => navigate(`/board/${project.id}`)} className="flex items-center gap-1 self-end text-xs text-muted-foreground hover:text-foreground" data-testid={`project-open-arrow-${project.id}`}>
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <RenameProjectDialog project={project} open={renameOpen} onOpenChange={setRenameOpen} onDone={onChanged} />
      <DeleteProjectDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} onDone={onChanged} />
    </>
  )
}