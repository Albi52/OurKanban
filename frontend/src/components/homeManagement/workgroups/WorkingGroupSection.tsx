import React, { useState } from 'react'
import type { WorkGroup } from '@app-types/workgroup'
import { Button } from '@components/shared/ui/button'
import { Plus, Users, LogOut, ChevronDown } from 'lucide-react'
import { ProjectCard } from '@components/homeManagement/projects/ProjectCard'
import { ParticipantsDialog } from '@components/homeManagement/workgroups/ParticipantsDialog'
import { leaveWorkGroup } from '@api/homeManagement/workGroupAPI'
import { toast } from 'sonner'
import { cn } from '@lib/utils'

interface Props {
  group: WorkGroup
  onChanged: () => void
  onCreateProject: () => void
}

export const WorkingGroupSection: React.FC<Props> = ({ group, onChanged, onCreateProject }) => {
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  async function handleLeave() {
    const confirmed = window.confirm('Leave this group? If you are the last member, it will be permanently deleted.')
    if (!confirmed) return
    try {
      await leaveWorkGroup(group.id)
      toast.success('Left group')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave group')
    }
  }

    return (
    <section data-testid={`group-section-${group.id}`}>
      <div className="mb-6 flex flex-col gap-4 border-b border-zinc-900 pb-4 sm:flex-row sm:items-end sm:justify-between">
               <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-start gap-2 text-left"
          data-testid={`toggle-group-${group.id}`}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={cn(
              'mt-1.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200',
              collapsed && '-rotate-90'
            )}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Working group</p>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="font-heading text-xl font-medium tracking-tight text-zinc-50 sm:text-2xl md:text-3xl">
                {group.name}
              </h2>
              {group.isLeader && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-emerald-300">
                  Leader
                </span>
              )}
              <span className="text-xs text-zinc-600">
                {group.projects.length} project{group.projects.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setParticipantsOpen(true)} className="border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900 hover:text-zinc-50" data-testid={`view-participants-${group.id}`}>
            <Users className="mr-2 h-4 w-4" />
            {group.isLeader ? `Manage (${group.members.length})` : `Members (${group.members.length})`}
          </Button>
          {group.isLeader && (
            <Button size="sm" onClick={onCreateProject} className="rounded-md bg-zinc-50 text-zinc-950 hover:bg-zinc-200" data-testid={`create-project-${group.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              New project
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLeave} className="text-red-400 hover:bg-red-500/10 hover:text-red-300" data-testid={`leave-group-${group.id}`}>
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
        </div>
      </div>

      {!collapsed && (group.projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center text-sm text-zinc-500 sm:p-10">
          No projects here yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {group.projects.map((p) => (
            <ProjectCard key={p.id} project={p} canManage={group.isLeader} onChanged={onChanged} />
          ))}
        </div>
      )
      )}

      <ParticipantsDialog open={participantsOpen} onOpenChange={setParticipantsOpen} group={group} onChanged={onChanged} />
    </section>
  )
}