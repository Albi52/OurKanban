import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject } from '@api/homeManagement/projectAPI'
import { getColumns } from '@api/board/columnAPI'
import type { ProjectSummary } from '@app-types/workgroup'
import type { BoardColumn } from '@app-types/board'
import { TopBar } from '@components/shared/TopBar'
import { Button } from '@components/shared/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/shared/ui/tabs'
import { KanbanView, type Task } from '@components/board/KanbanView'
import { CalendarView } from '@components/board/CalendarView'
import { Layout, CalendarDays, Columns } from 'lucide-react'

// Objeto simulado o recuperado de la sesión actual
const CURRENT_USER = {
  id: 1, // ID del usuario autenticado
  name: 'Current User',
}

export default function BoardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id)

  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [columns, setColumns] = useState<BoardColumn[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const [p, cols] = await Promise.all([
        getProject(projectId),
        getColumns(projectId),
      ])
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

  function handleDeleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId))
    if (selectedTaskId === taskId) setSelectedTaskId(null)
  }

  function handleUpdateTask(updatedTask: Task) {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    )
  }

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
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <TopBar />

      <div className="flex flex-1 flex-col mx-auto w-full max-w-[1800px] px-6 py-6 md:px-10">
        <Tabs defaultValue="kanban" className="flex flex-1 flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Project</p>
              <h1 className="font-heading text-3xl font-light tracking-tighter text-zinc-50 sm:text-4xl">
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
              <TabsTrigger
                value="split"
                className="text-zinc-400 data-[state=active]:bg-zinc-50 data-[state=active]:text-zinc-950"
                data-testid="board-tab-split"
              >
                <Columns className="mr-2 h-4 w-4" />
                Split View
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Vista Kanban individual */}
          <TabsContent value="kanban" className="mt-6 flex-1 flex flex-col min-h-0">
            <KanbanView
              project={project}
              columns={columns}
              tasks={tasks}
              currentUser={CURRENT_USER}
              selectedTaskId={selectedTaskId}
              onSelectTaskId={setSelectedTaskId}
              onTasksChange={setTasks}
              onColumnsChanged={load}
            />
          </TabsContent>

          {/* Vista Calendario individual */}
          <TabsContent value="calendar" className="mt-6 flex-1 flex flex-col min-h-0">
            <CalendarView
              project={project}
              tasks={tasks}
              currentUser={CURRENT_USER}
              selectedTaskId={selectedTaskId}
              onSelectTaskId={setSelectedTaskId}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              onCreateTask={(newTask) => setTasks((prev) => [...prev, newTask])}
            />
          </TabsContent>

          {/* Vista Dividida: Kanban + Calendario al mismo tiempo */}
          <TabsContent value="split" className="mt-6 flex-1 flex gap-6 overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800/80 pr-4">
              <KanbanView
                project={project}
                columns={columns}
                tasks={tasks}
                currentUser={CURRENT_USER}
                selectedTaskId={selectedTaskId}
                onSelectTaskId={setSelectedTaskId}
                onTasksChange={setTasks}
                onColumnsChanged={load}
              />
            </div>
            <div className="flex-1 flex flex-col min-w-0 pl-2">
              <CalendarView
                project={project}
                tasks={tasks}
                currentUser={CURRENT_USER}
                selectedTaskId={selectedTaskId}
                onSelectTaskId={setSelectedTaskId}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleUpdateTask}
                onCreateTask={(newTask) => setTasks((prev) => [...prev, newTask])}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}