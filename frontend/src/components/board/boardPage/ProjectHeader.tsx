import { TabsList, TabsTrigger } from '@components/shared/ui/tabs'
import { Layout, CalendarDays, Columns, LayoutGrid } from 'lucide-react'
import type { ProjectDetails } from '@app-types/workgroup'

interface ProjectHeaderProps {
  project: ProjectDetails
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0 mb-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Project</p>
        <h1 className="font-heading text-3xl font-light tracking-tighter text-foreground sm:text-4xl">
          {project.name}
        </h1>
      </div>

      <TabsList className="bg-card/60 border border-border" data-testid="board-tabs">
        <TabsTrigger value="kanban" className="text-muted-foreground data-[state=active]:bg-zinc-50 data-[state=active]:text-zinc-950">
          <Layout className="mr-2 h-4 w-4" /> Board
        </TabsTrigger>
        <TabsTrigger value="calendar" className="text-muted-foreground data-[state=active]:bg-zinc-50 data-[state=active]:text-zinc-950">
          <CalendarDays className="mr-2 h-4 w-4" /> Calendar
        </TabsTrigger>
        <TabsTrigger value="split" className="text-muted-foreground data-[state=active]:bg-zinc-50 data-[state=active]:text-zinc-950">
          <Columns className="mr-2 h-4 w-4" /> Split View
        </TabsTrigger>
        <TabsTrigger value="blackboard" className="text-muted-foreground data-[state=active]:bg-zinc-50 data-[state=active]:text-zinc-950">
          <LayoutGrid className="mr-2 h-4 w-4" /> Blackboard
        </TabsTrigger>
      </TabsList>
    </div>
  )
}