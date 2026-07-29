import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectSummary } from '../types/workgroup'
import { MoreHorizontal, ArrowUpRight } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { RenameProjectDialog } from './RenameProjectDialog'
import { DeleteProjectDialog } from './DeleteProjectDialog'

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
        className="group relative flex h-40 flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-transform transition-colors duration-200 ease-out hover:-translate-y-1 hover:border-zinc-600"
        data-testid={`project-card-${project.id}`}
      >
        {canManage && (
          <div className="absolute right-3 top-3 opacity-70 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                  data-testid={`project-menu-${project.id}`}
                  aria-label="Project actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950 text-zinc-100">
                <DropdownMenuItem onClick={() => setRenameOpen(true)} data-testid={`project-rename-${project.id}`} className="focus:bg-zinc-900 focus:text-zinc-50">
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Project</p>
          <h3 className="mt-2 font-heading text-xl font-medium tracking-tight text-zinc-50">{project.name}</h3>
        </button>

        <button onClick={() => navigate(`/board/${project.id}`)} className="flex items-center gap-1 self-end text-xs text-zinc-400 hover:text-zinc-50" data-testid={`project-open-arrow-${project.id}`}>
          Open
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <RenameProjectDialog project={project} open={renameOpen} onOpenChange={setRenameOpen} onDone={onChanged} />
      <DeleteProjectDialog project={project} open={deleteOpen} onOpenChange={setDeleteOpen} onDone={onChanged} />
    </>
  )
}