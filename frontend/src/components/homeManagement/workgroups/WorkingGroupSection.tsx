import React, { useState } from 'react'
import type { WorkGroup } from '@app-types/workgroup'
import { Button } from '@components/shared/ui/button'
import { Plus, Users, LogOut, ChevronDown } from 'lucide-react'
import { ProjectCard } from '@components/homeManagement/projects/ProjectCard'
import { ParticipantsDialog } from '@components/homeManagement/workgroups/ParticipantsDialog'
import { leaveWorkGroup } from '@api/homeManagement/workGroupAPI'
import { toast } from 'sonner'
import { cn } from '@lib/utils'
import { ConfirmActionDialog } from '@components/homeManagement/ConfirmActionDialog'
import { useAuth } from '@/context/AuthContext'
import { recordGroupOpened } from '@/lib/recentActivity'

interface Props {
  group: WorkGroup
  onChanged: () => void
  onCreateProject: () => void
  initiallyCollapsed: boolean
}

export const WorkingGroupSection: React.FC<Props> = ({ group, onChanged, onCreateProject, initiallyCollapsed }) => {
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(initiallyCollapsed)
  const [leaveOpen, setLeaveOpen] = useState(false)
    const { user } = useAuth()

  async function handleLeave() {
    try {
      await leaveWorkGroup(group.id)
      toast.success('Left group')
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave group')
    }
  }
  function handleCreateProject() {

    setCollapsed(false)
    onCreateProject()
     if (user) {
    
         
          recordGroupOpened(user.username, group.id)
        }
  }
  

  return (
    <section data-testid={`group-section-${group.id}`}>
      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-start gap-2 text-left"
          data-testid={`toggle-group-${group.id}`}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={cn(
              'mt-1.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              collapsed && '-rotate-90'
            )}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Working group</p>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="font-heading text-xl font-medium tracking-tight text-foreground sm:text-2xl md:text-3xl">
                {group.name}
              </h2>
              {group.isLeader && (
                <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-success">
                  Leader
                </span>
              )}
              <span className="text-xs text-muted-foreground-subtle">
                {group.projects.length} project{group.projects.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setParticipantsOpen(true)} className="border-border bg-transparent text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground" data-testid={`view-participants-${group.id}`}>
            <Users className="mr-2 h-4 w-4" />
            {group.isLeader ? `Manage (${group.members.length})` : `Members (${group.members.length})`}
          </Button>
          {group.isLeader && (
            <Button size="sm" onClick={handleCreateProject} className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90" data-testid={`create-project-${group.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              New project
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setLeaveOpen(true)} className="text-destructive hover:bg-destructive/10 hover:text-red-300" data-testid={`leave-group-${group.id}`}>
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
        </div>
      </div>

      {!collapsed && (group.projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-zinc-900/20 p-8 text-center text-sm text-muted-foreground sm:p-10">
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
      <ConfirmActionDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Leave working group"
        description={
          <>
            Leave{' '}
            <span className="text-foreground-secondary">
              {group.name}
            </span>
            ? You will lose access to all projects in this group.
          </>
        }
        confirmText="Leave"
        successMessage="Successfully left working group"
        errorMessage="Failed to leave working group"
        onConfirm={handleLeave}
        testId="leave-group-dialog"
      />


    </section>
  )
}
         

   