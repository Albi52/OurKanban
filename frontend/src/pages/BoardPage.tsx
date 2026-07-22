import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject } from '../api/projectAPI'
import { getColumns } from '../api/columnAPI'
import type { ProjectSummary } from '../types/workgroup'
import type { BoardColumn } from '../types/board'
import { TopBar } from '../components/TopBar'
import { Button } from '../components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { KanbanView } from '../components/board/KanbanView'
import { CalendarView } from '../components/board/CalendarView'
import { Layout, CalendarDays } from 'lucide-react'

// ---------------------------------------------------------------------------
// NOTE FOR WHOEVER ADDS WEBSOCKETS:
//
// This page loads the board once via REST (`load()` below) and never
// updates after that unless the current user makes a change themselves.
//
// Intended integration point:
//   - Keep `load()` for the initial fetch when the page opens (REST is
//     still right for "give me everything right now").
//   - After connecting to the socket (e.g. a new useEffect keyed on
//     `projectId`), subscribe to a project-scoped topic
//     (e.g. `/topic/projects/{projectId}`) and merge incoming events into
//     `columns` (and later `tasks`) via their setters here, then pass the
//     updated state down to both `KanbanView` and `CalendarView` as props.
//     Both tabs stay mounted at once (see TabsContent below — Radix keeps
//     inactive panels in the DOM, just hidden), so both will reflect live
//     updates immediately even while not the visible tab, since they share
//     this one source of truth instead of each fetching independently.
//   - `project.isLeader` is already computed server-side on `ProjectSummary`
//     — reuse it for any other leader-only realtime action.
// ---------------------------------------------------------------------------

export default function BoardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [columns, setColumns] = useState<BoardColumn[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [p, cols] = await Promise.all([getProject(projectId), getColumns(projectId)])
      setProject(p)
      setColumns(cols)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this project')
    }
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-red-400">{error}</p>
        <Button onClick={() => navigate('/home')} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200">
          Back to home
        </Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <TopBar />

      <div className="mx-auto max-w-[1600px] px-6 py-8 md:px-10">
        {/* Single Tabs root wraps both the switcher and the panels below —
            required so Radix's active-tab state is shared between them.
            Don't split this into two <Tabs> instances; the triggers and
            the content must be siblings under one root. */}
        <Tabs defaultValue="kanban">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Project</p>
              <h1 className="mt-2 font-heading text-4xl font-light tracking-tighter text-zinc-50 md:text-5xl">
                {project.name}
              </h1>
            </div>

            <TabsList className="bg-zinc-900/60 border border-zinc-800" data-testid="board-tabs">
              <TabsTrigger
                value="kanban"
                className="text-zinc-400 data-[state=active]:bg-zinc-50 data-[state=active]:text-zinc-950"
                data-testid="board-tab-kanban"
              >
                <Layout className="mr-2 h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="text-zinc-400 data-[state=active]:bg-zinc-50 data-[state=active]:text-zinc-950"
                data-testid="board-tab-calendar"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kanban" className="mt-8">
            <KanbanView project={project} columns={columns} onColumnsChanged={load} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-8">
            <CalendarView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}