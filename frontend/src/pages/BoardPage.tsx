import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject } from '@api/homeManagement/projectAPI'
import { getColumns } from '@api/board/columnAPI'
import { getMyWorkGroups } from '@/api/homeManagement/workGroupAPI'
import { getMe } from '@/api/account/authAPI'
import { useStomp, type TaskDto } from '../components/webSockets/useStomp'

import type { Member, ProjectSummary } from '@app-types/workgroup'
import type { BoardColumn } from '@app-types/board'
import { TopBar } from '@components/shared/TopBar'
import { Button } from '@components/shared/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/shared/ui/tabs'
import { KanbanView, type Task, type Priority } from '@components/board/KanbanView'
import { BlackboardView } from '@components/board/BlackboardView'
import { CalendarView } from '@components/board/CalendarView'
import { Layout, CalendarDays, Columns, LayoutGrid, Pencil, Trash2, X } from 'lucide-react'
import { Input } from '@components/shared/ui/input'
import type { ProjectMember } from '@/types/projectMember'
import { useAuth } from '@context/AuthContext'
import stompService from '@/components/webSockets/StompService'

if (typeof window !== 'undefined' && !(window as any).global) {
  ;(window as any).global = window
}

export default function BoardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectId = Number(id) || 0
  const { token } = useAuth()

  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [columns, setColumns] = useState<BoardColumn[]>([])
  const [groupMembers, setGroupMembers] = useState<Member[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [currentUser, setCurrentUser] = useState<ProjectMember | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editPriority, setEditPriority] = useState<string>('medium')
  const [editAssigneeId, setEditAssigneeId] = useState<number | undefined>(undefined)

  const {
    sendTaskMessage,
    subscribeTaskMessages,
  } = useStomp()

  useEffect(() => {
    if (!token) return
    stompService.connect(token, projectId)
    return () => {
      stompService.disconnect()
    }
  }, [token, projectId])

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null
  const mainBoardRef = useRef<HTMLDivElement>(null)

  const handleWebSocketTaskMessage = useCallback((rawDto: TaskDto) => {
    if (!rawDto || rawDto.id == null) return

    setTasks((prev) => {
      const existingIndex = prev.findIndex((t) => String(t.id) === String(rawDto.id))
      const existingTask = existingIndex !== -1 ? prev[existingIndex] : undefined

      const hasValidMove = Boolean(
        rawDto.moverName && (rawDto.positionX !== 0 || rawDto.positionY !== 0)
      )

      const mappedTask: Task = {
        id: String(rawDto.id),
        columnId: rawDto.columnId != null ? Number(rawDto.columnId) : (existingTask?.columnId ?? -1),
        title: rawDto.title !== undefined ? String(rawDto.title) : (existingTask?.title ?? ''),
        description: rawDto.description !== undefined ? String(rawDto.description) : (existingTask?.description ?? ''),
        startDate: rawDto.startDate ? String(rawDto.startDate) : (existingTask?.startDate ?? ''),
        endDate: rawDto.endDate ? String(rawDto.endDate) : (existingTask?.endDate ?? ''),
        priority: rawDto.priority ? (String(rawDto.priority).toLowerCase() as Priority) : (existingTask?.priority ?? 'medium'),
        author: rawDto.authorId
          ? {
              id: Number(rawDto.authorId),
              username: String(rawDto.authorName || 'User'),
              profilePicture: null,
            }
          : (existingTask?.author ?? { id: 0, username: 'User', profilePicture: null }),
        assignee: rawDto.assigneeId
          ? {
              id: Number(rawDto.assigneeId),
              username: String(rawDto.assigneeName || ''),
              profilePicture: null,
            }
          : undefined,
        type: 'task',
        positionX: hasValidMove ? rawDto.positionX : 0,
        positionY: hasValidMove ? rawDto.positionY : 0,
        moverName: hasValidMove ? rawDto.moverName : undefined,
      }

      if (existingIndex !== -1) {
        const updated = [...prev]
        updated[existingIndex] = mappedTask
        return updated
      }

      return [...prev, mappedTask]
    })
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [projData, colsData, meData, userGroups] = await Promise.all([
        getProject(projectId).catch(() => null),
        getColumns(projectId).catch(() => []),
        getMe().catch(() => null),
        getMyWorkGroups().catch(() => []),
      ])

      if (!projData) {
        throw new Error('No se pudo cargar la información de este proyecto.')
      }

      setProject(projData)

      const colsList: BoardColumn[] = Array.isArray(colsData) ? colsData : []
      setColumns(colsList)

      const extractedTasks: Task[] = []
      colsList.forEach((col: BoardColumn) => {
        if (Array.isArray(col.tasks)) {
          col.tasks.forEach((t: TaskDto) => {
            if (!t || t.id == null) return

            extractedTasks.push({
              id: String(t.id),
              columnId: t.columnId != null ? Number(t.columnId) : Number(col.id),
              title: String(t.title || ''),
              description: String(t.description || ''),
              startDate: t.startDate ? String(t.startDate) : '',
              endDate: t.endDate ? String(t.endDate) : '',
              priority: (t.priority ? String(t.priority).toLowerCase() : 'medium') as Priority,
              author: {
                id: Number(t.authorId || 0),
                username: String(t.authorName || 'User'),
                profilePicture: null,
              },
              assignee: t.assigneeId
                ? {
                    id: Number(t.assigneeId),
                    username: String(t.assigneeName || ''),
                    profilePicture: null,
                  }
                : undefined,
              type: 'task',
              positionX: t.positionX,
              positionY: t.positionY,
              moverName: t.moverName,
            })
          })
        }
      })

      setTasks(extractedTasks)

      const userGroupsList = Array.isArray(userGroups) ? userGroups : []
      const currentGroup = userGroupsList.find((g) => g && g.id === projData.workGroupId)
      const members = currentGroup?.members || []
      setGroupMembers(members)

      const currentMember = meData ? members.find((m) => m.username === meData.username) : null

      setCurrentUser({
        id: currentMember?.id || 0,
        userId: currentMember?.id || 0,
        username: meData?.username || 'Usuario',
        displayName: meData?.username || 'Usuario',
        profilePicture: meData?.profilePicture || null,
      })
    } catch (err: any) {
      console.error('Error al cargar datos del proyecto:', err)
      setError(err?.message || 'Could not load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadData()
    } else {
      setError('ID de proyecto no válido')
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    const unsubscribe = subscribeTaskMessages(handleWebSocketTaskMessage)
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [subscribeTaskMessages, handleWebSocketTaskMessage])

  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title)
      setEditDesc(selectedTask.description)
      setEditStart(selectedTask.startDate)
      setEditEnd(selectedTask.endDate)
      setEditPriority(selectedTask.priority || 'medium')
      setEditAssigneeId(selectedTask.assignee?.id)
      setIsEditing(false)
    }
  }, [selectedTaskId, selectedTask])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!selectedTaskId) return
      const target = event.target as HTMLElement

      if (
        target.closest('[data-task-item="true"]') ||
        target.closest('[data-task-sidebar="true"]') ||
        target.closest('[data-radix-portal]') ||
        target.closest('.fixed')
      ) {
        return
      }

      setSelectedTaskId(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedTaskId])

  function handleCreateTask(
    columnId: number,
    taskData: Omit<Task, 'id' | 'columnId' | 'author'>
  ) {
    sendTaskMessage({
      action: 'CREATE',
      projectId: projectId,
      columnId: columnId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority.toUpperCase(),
      assigneeId: taskData.assignee?.id,
      dateStart: taskData.startDate || undefined,
      dateEnd: taskData.endDate || undefined,
    })
  }

  function handleMoveTask(
    taskId: string,
    newColumnId: number,
    positionX: number,
    positionY: number
  ): boolean {
    return sendTaskMessage({
      action: 'MOVE',
      projectId,
      taskId: Number(taskId),
      columnId: newColumnId,
      positionX,
      positionY,
    })
  }

  function handleDeleteTask(taskId: string) {
    sendTaskMessage({
      action: 'DELETE',
      projectId,
      taskId: Number(taskId),
    })
    setTasks((current) => current.filter((task) => task.id !== taskId))
    if (selectedTaskId === taskId) setSelectedTaskId(null)
  }

  function handleSaveEdit() {
    if (!selectedTask) return
    sendTaskMessage({
      action: 'UPDATE',
      projectId,
      taskId: Number(selectedTask.id),
      columnId: selectedTask.columnId,
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority.toUpperCase(),
      assigneeId: editAssigneeId,
      dateStart: editStart || undefined,
      dateEnd: editEnd || undefined,
    })
    setIsEditing(false)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-destructive font-semibold">{error}</p>
        <Button onClick={() => navigate('/home')} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Back to home
        </Button>
      </div>
    )
  }

  if (loading || !project || !currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Loading...
      </div>
    )
  }

  const currentUserAsMember: Member = {
    id: currentUser.id,
    username: currentUser.username,
    profilePicture: currentUser.profilePicture,
  }

  const canModifySelected = project.isLeader || (selectedTask && selectedTask.author?.id === currentUser.id)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TopBar />

      <div ref={mainBoardRef} className="flex flex-1 flex-col mx-auto w-full max-w-[1800px] px-6 py-6 md:px-10 overflow-hidden">
        <Tabs defaultValue="kanban" className="flex flex-1 flex-col overflow-hidden">
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

          <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <TabsContent value="kanban" className="m-0 flex-1 flex flex-col min-h-0">
                <KanbanView
                  project={project}
                  columns={columns}
                  tasks={tasks}
                  currentUser={currentUserAsMember}
                  groupMembers={groupMembers}
                  selectedTaskId={selectedTaskId}
                  onSelectTaskId={setSelectedTaskId}
                  onTasksChange={setTasks}
                  onColumnsChanged={loadData}
                  onCreateTask={handleCreateTask}
                  onMoveTask={handleMoveTask}
                />
              </TabsContent>

              <TabsContent value="calendar" className="m-0 flex-1 flex flex-col min-h-0">
                <CalendarView
                  project={project}
                  tasks={tasks}
                  currentUser={currentUserAsMember}
                  selectedTaskId={selectedTaskId}
                  onSelectTaskId={setSelectedTaskId}
                  onDeleteTask={handleDeleteTask}
                />
              </TabsContent>

              <TabsContent value="split" className="m-0 flex-1 flex gap-6 overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col min-w-0 border-r border-border/80 pr-4">
                  <KanbanView
                    project={project}
                    columns={columns}
                    tasks={tasks}
                    currentUser={currentUserAsMember}
                    groupMembers={groupMembers}
                    selectedTaskId={selectedTaskId}
                    onSelectTaskId={setSelectedTaskId}
                    onTasksChange={setTasks}
                    onColumnsChanged={loadData}
                    onCreateTask={handleCreateTask}
                    onMoveTask={handleMoveTask}
                  />
                </div>
                <div className="flex-1 flex flex-col min-w-0 pl-2">
                  <CalendarView
                    project={project}
                    tasks={tasks}
                    currentUser={currentUserAsMember}
                    selectedTaskId={selectedTaskId}
                    onSelectTaskId={setSelectedTaskId}
                    onDeleteTask={handleDeleteTask}
                  />
                </div>
              </TabsContent>
              <TabsContent value="blackboard" className="m-0 flex-1 flex flex-col min-h-0">
                <BlackboardView project={project} currentUser={currentUserAsMember} />
              </TabsContent>
            </div>

            {selectedTask && (
              <div data-task-sidebar="true" className="w-80 shrink-0 h-full rounded-xl border border-border bg-background p-5 flex flex-col justify-between overflow-y-auto z-10">
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {selectedTask.type === 'event' ? 'Event Info' : 'Task Info'}
                    </span>
                    <div className="flex items-center gap-1">
                      {canModifySelected && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground" title="Edit Item">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => setSelectedTaskId(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-4 space-y-4 text-xs">
                      <div>
                        <label className="font-medium text-muted-foreground">Title</label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 border-border bg-zinc-900 text-foreground-secondary" />
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Description</label>
                        <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="mt-1 min-h-[90px] w-full rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary focus:outline-none focus:ring-1 focus:ring-zinc-500" />
                      </div>

                      <div>
                        <label className="font-medium text-muted-foreground block mb-1">Priority</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditPriority('low')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition ${
                              editPriority === 'low'
                                ? 'bg-emerald-950 border-emerald-500 text-success'
                                : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-800'
                            }`}
                          >
                            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPriority('medium')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition ${
                              editPriority === 'medium'
                                ? 'bg-amber-950 border-amber-500 text-amber-300'
                                : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-800'
                            }`}
                          >
                            <span className="h-2 w-2 rounded-full bg-amber-500" /> Medium
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditPriority('high')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition ${
                              editPriority === 'high'
                                ? 'bg-red-950 border-destructive text-red-300'
                                : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-800'
                            }`}
                          >
                            <span className="h-2 w-2 rounded-full bg-destructive" /> High
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="font-medium text-muted-foreground block mb-1">Assignee</label>
                        <select
                          value={editAssigneeId || ''}
                          onChange={(e) => setEditAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary focus:outline-none focus:ring-1 focus:ring-zinc-500"
                        >
                          <option value="">Unassigned</option>
                          {groupMembers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.username} {m.id === currentUser.id ? '(You)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-medium text-muted-foreground">Start Date</label>
                          <Input
                            type="date"
                            value={editStart}
                            onChange={(e) => {
                              setEditStart(e.target.value)
                              if (selectedTask.type === 'event') setEditEnd(e.target.value)
                            }}
                            className="mt-1 border-border bg-zinc-900 text-foreground-secondary"
                          />
                        </div>
                        {selectedTask.type !== 'event' && (
                          <div>
                            <label className="font-medium text-muted-foreground">End Date</label>
                            <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="mt-1 border-border bg-zinc-900 text-foreground-secondary" />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              selectedTask.priority === 'high'
                                ? 'bg-destructive'
                                : selectedTask.priority === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {selectedTask.priority || 'medium'} priority
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground-secondary">{selectedTask.title}</h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {selectedTask.description || <span className="italic text-muted-foreground-subtle">No description provided.</span>}
                        </p>
                      </div>

                      <div className="space-y-2 rounded-xl border border-border bg-zinc-900/50 p-3 text-xs">
                        <div>
                          <span className="font-medium text-muted-foreground block">Author:</span>
                          <span className="text-foreground-secondary">{selectedTask.author?.username || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground block">Assignee:</span>
                          <span className="text-foreground-secondary font-medium">{selectedTask.assignee?.username || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <div>
                            <span className="font-medium text-muted-foreground block">Start:</span>
                            <span className="text-foreground-secondary">{selectedTask.startDate || '-'}</span>
                          </div>
                          {selectedTask.type !== 'event' && (
                            <div>
                              <span className="font-medium text-muted-foreground block">End:</span>
                              <span className="text-foreground-secondary">{selectedTask.endDate || '-'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && canModifySelected && (
                  <div className="pt-4 border-t border-border mt-4">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(selectedTask.id)} className="w-full text-destructive hover:bg-red-950/30 hover:text-red-300">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete {selectedTask.type === 'event' ? 'Event' : 'Task'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  )
}