import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DragStart,
  type DroppableProvided,
  type DraggableProvided,
  type DroppableStateSnapshot,
  type DraggableStateSnapshot,
} from '@hello-pangea/dnd'
import { addColumn } from '@api/board/columnAPI'
import type { Member, ProjectSummary } from '../../types/workgroup'
import type { BoardColumn } from '../../types/board'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  columnId: number
  title: string
  description: string
  startDate: string
  endDate: string
  priority: Priority
  author: Member
  assignee?: Member
  type?: 'task' | 'event'
  positionX?: number
  positionY?: number
  moverName?: string
}

interface Props {
  project: ProjectSummary
  columns: BoardColumn[]
  tasks: Task[]
  currentUser: Member
  groupMembers: Member[]
  selectedTaskId: string | null
  onSelectTaskId: (taskId: string | null) => void
  onTasksChange: (tasks: Task[]) => void
  onColumnsChanged: () => void
  onCreateTask?: (columnId: number, taskData: Omit<Task, 'id' | 'columnId' | 'author'>) => void
  onMoveTask?: (taskId: string, newColumnId: number, positionX: number, positionY: number) => boolean | void
}

const defaultColumns: BoardColumn[] = [
  { id: 1, name: 'Undo', position: 10 },
  { id: 2, name: 'Doing', position: 20 },
  { id: 3, name: 'Done', position: 30 },
]

function getInitials(name?: string) {
  if (!name) return ''
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function KanbanView({
  project,
  columns,
  tasks,
  currentUser,
  groupMembers = [],
  selectedTaskId,
  onSelectTaskId,
  onTasksChange,
  onColumnsChanged,
  onCreateTask,
  onMoveTask,
}: Props) {
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>(() =>
    columns.length > 0 ? columns : defaultColumns,
  )
  const [adding, setAdding] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [busy, setBusy] = useState(false)

  const activeDraggingTaskIdRef = useRef<string | null>(null)
  const activeDraggingColumnIdRef = useRef<number | null>(null)
  const lastEmitTimeRef = useRef<number>(0)
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBoardColumns(columns.length > 0 ? columns : defaultColumns)
  }, [columns])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!activeDraggingTaskIdRef.current || !onMoveTask || !boardRef.current) return

    const now = Date.now()
    if (now - lastEmitTimeRef.current < 40) return

    const boardRect = boardRef.current.getBoundingClientRect()
    const relativeX = Math.round(e.clientX - boardRect.left + boardRef.current.scrollLeft)
    const relativeY = Math.round(e.clientY - boardRect.top + boardRef.current.scrollTop)

    lastEmitTimeRef.current = now
    onMoveTask(
      activeDraggingTaskIdRef.current,
      activeDraggingColumnIdRef.current || 0,
      relativeX,
      relativeY
    )
  }, [onMoveTask])

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [handlePointerMove])

  function onDragStart(start: DragStart) {
    if (start.type === 'TASK') {
      const task = tasks.find((t) => t.id === start.draggableId)
      activeDraggingTaskIdRef.current = start.draggableId
      activeDraggingColumnIdRef.current = task ? task.columnId : Number(start.source.droppableId)

      if (onMoveTask) {
        onMoveTask(
          start.draggableId,
          activeDraggingColumnIdRef.current,
          1,
          1
        )
      }
    }
  }

function onDragEnd(result: DropResult) {
  const draggingId = activeDraggingTaskIdRef.current
  activeDraggingTaskIdRef.current = null
  activeDraggingColumnIdRef.current = null

  const { destination, source, draggableId, type } = result

  if (!destination) {
    if (draggingId && onMoveTask) {
      onMoveTask(draggingId, 0, 0, 0)
    }
    return
  }

  if (destination.droppableId === source.droppableId && destination.index === source.index) {
    if (draggingId && onMoveTask) {
      onMoveTask(draggingId, Number(destination.droppableId), 0, 0)
    }
    return
  }

  if (type === 'COLUMN') {
    const newCols = Array.from(boardColumns)
    const [reorderedCol] = newCols.splice(source.index, 1)
    newCols.splice(destination.index, 0, reorderedCol)

    setBoardColumns(
      newCols.map((col, idx) => ({ ...col, position: (idx + 1) * 10 }))
    )
    return
  }

  if (type === 'TASK') {
    const destColId = Number(destination.droppableId)
    const previousTasks = [...tasks] // Copia de seguridad del estado previo

    // 1. Intentar enviar la petición al servidor
    const sentSuccessfully = onMoveTask ? onMoveTask(draggableId, destColId, 0, 0) : true

    // 2. Si falla el envío (sin conexión o error), abortar y no mover
    if (sentSuccessfully === false) {
      toast.error('No se pudo mover la tarea. Error de conexión con el servidor.')
      onTasksChange(previousTasks)
      return
    }

    // 3. Si se envió con éxito, aplicar la actualización local ordenada alfabéticamente
    const updated = Array.from(tasks)
    const taskIndex = updated.findIndex((t) => t.id === draggableId)
    if (taskIndex === -1) return

    const [movedTask] = updated.splice(taskIndex, 1)
    movedTask.columnId = destColId
    movedTask.moverName = undefined
    movedTask.positionX = 0
    movedTask.positionY = 0

    const destTasks = [...updated.filter((t) => t.columnId === destColId), movedTask].sort(
      (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    )
    const otherTasks = updated.filter((t) => t.columnId !== destColId)

    onTasksChange([...otherTasks, ...destTasks])
  }
}

  async function handleAddColumn() {
    if (!newColumnName.trim()) return

    if (columns.length > 0) {
      setBusy(true)
      try {
        await addColumn(project.id, newColumnName.trim())
        setNewColumnName('')
        setAdding(false)
        onColumnsChanged()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add column')
      } finally {
        setBusy(false)
      }
      return
    }

    setBoardColumns((current) => [
      ...current,
      {
        id: Date.now(),
        name: newColumnName.trim(),
        position: current.length * 10 + 10,
      },
    ])
    setNewColumnName('')
    setAdding(false)
  }

  function handleRemoveColumn(columnId: number) {
    setBoardColumns((current) => current.filter((column) => column.id !== columnId))
    onTasksChange(tasks.filter((task) => task.columnId !== columnId))
  }

  function handleCreateTask(columnId: number, taskData: Omit<Task, 'id' | 'columnId' | 'author'>) {
    if (onCreateTask) {
      onCreateTask(columnId, taskData)
    } else {
      onTasksChange([
        ...tasks,
        {
          id: '',
          columnId,
          title: taskData.title,
          description: taskData.description,
          startDate: taskData.startDate,
          endDate: taskData.endDate,
          priority: taskData.priority || 'medium',
          author: currentUser,
          assignee: taskData.assignee,
          type: 'task',
        },
      ])
    }
  }

  function handleDeleteTask(taskId: string) {
    onTasksChange(tasks.filter((task) => task.id !== taskId))
    if (selectedTaskId === taskId) onSelectTaskId(null)
  }

  const liveMovingTasks = tasks.filter(
    (t) =>
      Boolean(t.moverName && t.moverName !== currentUser.username) &&
      ((t.positionX ?? 0) > 1 || (t.positionY ?? 0) > 1)
  )

  return (
    <div className="relative flex h-full w-full flex-1 overflow-hidden" data-testid="kanban-view" ref={boardRef}>
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-1 snap-x snap-mandatory gap-5 overflow-x-auto pb-4 h-full w-full"
            >
              {boardColumns.map((column, index) => (
                <Draggable
                  key={column.id}
                  draggableId={`col-${column.id}`}
                  index={index}
                  isDragDisabled={!project.isLeader}
                >
                  {(dragProvided: DraggableProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="snap-center h-full"
                    >
                      <BoardColumnView
                        column={column}
                        project={project}
                        currentUser={currentUser}
                        groupMembers={groupMembers}
                        tasks={tasks
                          .filter((task) => task.columnId === column.id && task.type !== 'event')
                          .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))}
                        selectedTaskId={selectedTaskId}
                        onAddTask={handleCreateTask}
                        onDeleteTask={handleDeleteTask}
                        onSelectTask={(task) => onSelectTaskId(task.id)}
                        onRemoveColumn={project.isLeader ? handleRemoveColumn : undefined}
                        canRemoveColumn={project.isLeader && boardColumns.length > 1}
                        dragHandleProps={dragProvided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {project.isLeader && (
                <div className="flex w-80 shrink-0 flex-col">
                  {adding ? (
                    <div className="rounded-xl border border-border bg-card/60 p-3">
                      <Input
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="Column name"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                        className="border-border bg-background text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
                        data-testid="new-column-input"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddColumn}
                          disabled={busy || !newColumnName.trim()}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          data-testid="new-column-confirm"
                        >
                          {busy ? 'Adding...' : 'Add'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAdding(false)}
                          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAdding(true)}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-border-hover hover:text-foreground-secondary"
                      data-testid="add-column-btn"
                    >
                      <Plus className="h-4 w-4" />
                      Add column
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Renderizado de tarjetas flotantes en tiempo real movidas por otros usuarios */}
      {liveMovingTasks.map((t) => (
        <div
          key={`live-${t.id}`}
          style={{
            position: 'absolute',
            left: `${t.positionX}px`,
            top: `${t.positionY}px`,
            transform: 'translate(-50%, -50%) rotate(2deg)',
            pointerEvents: 'none',
            zIndex: 1000,
            transition: 'top 0.05s linear, left 0.05s linear',
          }}
          className="w-64 rounded-2xl border border-amber-500/80 bg-zinc-950/95 p-4 shadow-2xl shadow-amber-500/20 ring-2 ring-amber-500/40"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950">
              {getInitials(t.moverName)}
            </span>
            <span className="text-[11px] font-semibold text-amber-300 truncate">
              {t.moverName} está moviendo
            </span>
          </div>
          <p className="font-semibold text-sm text-foreground-secondary truncate">{t.title}</p>
        </div>
      ))}
    </div>
  )
}

function BoardColumnView({
  column,
  project,
  currentUser,
  groupMembers = [],
  tasks,
  selectedTaskId,
  onAddTask,
  onDeleteTask,
  onSelectTask,
  onRemoveColumn,
  canRemoveColumn,
  dragHandleProps,
}: {
  column: BoardColumn
  project: ProjectSummary
  currentUser: Member
  groupMembers: Member[]
  tasks: Task[]
  selectedTaskId: string | null
  onAddTask: (columnId: number, task: Omit<Task, 'id' | 'columnId' | 'author'>) => void
  onDeleteTask: (taskId: string) => void
  onSelectTask: (task: Task) => void
  onRemoveColumn?: (columnId: number) => void
  canRemoveColumn: boolean
  dragHandleProps?: any
}) {
  const [addingTask, setAddingTask] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [openStartPicker, setOpenStartPicker] = useState(false)
  const [openEndPicker, setOpenEndPicker] = useState(false)

  const startButtonRef = useRef<HTMLButtonElement>(null)
  const endButtonRef = useRef<HTMLButtonElement>(null)

  function resetTaskForm() {
    setTitle('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setPriority('medium')
    setAssigneeId(undefined)
    setError(null)
    setBusy(false)
    setOpenStartPicker(false)
    setOpenEndPicker(false)
  }

  function handleSaveTask() {
    if (!title.trim()) {
      setError('A task title is required.')
      return
    }

    const chosenAssignee = groupMembers.find((m) => m.id === assigneeId)

    setBusy(true)
    onAddTask(column.id, {
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate,
      priority,
      assignee: chosenAssignee,
    })
    resetTaskForm()
    setAddingTask(false)
  }

  return (
    <div
      className="flex h-full w-[85vw] max-w-[320px] shrink-0 flex-col rounded-xl border border-border bg-card/40"
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab text-muted-foreground-subtle hover:text-foreground-secondary active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <span className="font-heading text-sm font-medium uppercase tracking-[0.15em] text-foreground-secondary">
            {column.name}
          </span>
        </div>

        {canRemoveColumn && onRemoveColumn ? (
          <button
            type="button"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
            onClick={() => onRemoveColumn(column.id)}
            aria-label={`Remove ${column.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <Droppable droppableId={String(column.id)} type="TASK">
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-3 p-3 overflow-y-auto transition-colors ${
              snapshot.isDraggingOver ? 'bg-zinc-900/30' : ''
            }`}
          >
            {tasks.length > 0 ? (
              tasks.map((task, index) => {
                const isSelected = task.id === selectedTaskId
                const isAssignedToMe = task.assignee?.id === currentUser.id
                const isBeingMovedByOther = Boolean(task.moverName && task.moverName !== currentUser.username)

                const priorityBorder =
                  task.priority === 'high'
                    ? 'border-l-4 border-l-red-500'
                    : task.priority === 'medium'
                      ? 'border-l-4 border-l-amber-500'
                      : 'border-l-4 border-l-emerald-500'

                return (
                  <Draggable
                    key={task.id || index}
                    draggableId={task.id || `temp-${index}`}
                    index={index}
                    isDragDisabled={isBeingMovedByOther}
                  >
                    {(taskProvided: DraggableProvided, taskSnapshot: DraggableStateSnapshot) => (
                      <div
                        ref={taskProvided.innerRef}
                        {...taskProvided.draggableProps}
                        {...taskProvided.dragHandleProps}
                        data-task-item="true"
                        onClick={() => !isBeingMovedByOther && onSelectTask(task)}
                        className={`group relative rounded-2xl border bg-background p-4 transition ${
                          isBeingMovedByOther
                            ? 'opacity-40 cursor-not-allowed border-amber-500/50 ring-2 ring-amber-500/30'
                            : 'cursor-pointer hover:border-border-hover'
                        } ${priorityBorder} ${
                          isAssignedToMe
                            ? 'ring-2 ring-indigo-500/80 shadow-md shadow-indigo-950/50'
                            : ''
                        } ${
                          isSelected
                            ? 'border-input ring-2 ring-zinc-500/40 shadow-lg shadow-black/80'
                            : 'border-border'
                        } ${taskSnapshot.isDragging ? 'shadow-lg shadow-black/60 ring-1 ring-zinc-700' : ''}`}
                      >
                        {isBeingMovedByOther && task.moverName && (
                          <span
                            title={`Moviendo por ${task.moverName}`}
                            className="absolute -top-2.5 -right-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-zinc-950 shadow-md ring-2 ring-background border border-amber-400"
                          >
                            {getInitials(task.moverName)}
                          </span>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground-secondary">{task.title}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">
                              {task.description || (
                                <span className="italic text-muted-foreground-subtle">No description</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {task.assignee && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-full w-max border border-indigo-800/40">
                            <UserIcon className="h-3 w-3 text-indigo-400" />
                            <span className="truncate">{task.assignee.username}</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground border-t border-border pt-2">
                          <span>
                            <span className="font-medium text-muted-foreground">Start:</span>{' '}
                            {task.startDate || '-'}
                          </span>
                          <span>
                            <span className="font-medium text-muted-foreground">End:</span>{' '}
                            {task.endDate || '-'}
                          </span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-center text-xs text-muted-foreground">
                No tasks yet. Add one to this column.
              </div>
            )}
            {provided.placeholder}

            {addingTask ? (
              <div className="rounded-3xl border border-border bg-background/80 p-4">
                <div className="space-y-3">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    className="border-border bg-zinc-900 text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:ring-zinc-500"
                    data-testid="task-title-input"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="min-h-[80px] w-full rounded-md border border-border bg-zinc-900 px-3 py-2 text-xs text-foreground-secondary placeholder:text-muted-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                  />

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                      Priority
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setPriority('low')}
                        className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition ${
                          priority === 'low'
                            ? 'bg-emerald-950 border border-emerald-500 text-success'
                            : 'bg-zinc-900 border border-border text-muted-foreground'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Low
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriority('medium')}
                        className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition ${
                          priority === 'medium'
                            ? 'bg-amber-950 border border-amber-500 text-amber-300'
                            : 'bg-zinc-900 border border-border text-muted-foreground'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Med
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriority('high')}
                        className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition ${
                          priority === 'high'
                            ? 'bg-red-950 border border-destructive text-red-300'
                            : 'bg-zinc-900 border border-border text-muted-foreground'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        High
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                      Assignee
                    </label>
                    <select
                      value={assigneeId || ''}
                      onChange={(e) =>
                        setAssigneeId(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-full rounded-md border border-border bg-zinc-900 p-1.5 text-xs text-foreground-secondary focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {groupMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.username} {member.id === currentUser.id ? '(You)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <button
                        ref={startButtonRef}
                        type="button"
                        onClick={() => {
                          setOpenStartPicker((prev) => !prev)
                          setOpenEndPicker(false)
                        }}
                        className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-zinc-900 px-3 text-xs text-foreground-secondary hover:border-border-hover"
                      >
                        <span className="truncate">{startDate || 'Start date'}</span>
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>

                      {openStartPicker && (
                        <DatePickerPopover
                          triggerRef={startButtonRef}
                          selectedDate={startDate}
                          otherDate={endDate}
                          isSelectingStart={true}
                          onSelect={(d) => {
                            setStartDate(d)
                            setOpenStartPicker(false)
                            setOpenEndPicker(true)
                          }}
                          onClose={() => setOpenStartPicker(false)}
                        />
                      )}
                    </div>

                    <div>
                      <button
                        ref={endButtonRef}
                        type="button"
                        onClick={() => {
                          setOpenEndPicker((prev) => !prev)
                          setOpenStartPicker(false)
                        }}
                        className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-zinc-900 px-3 text-xs text-foreground-secondary hover:border-border-hover"
                      >
                        <span className="truncate">{endDate || 'End date'}</span>
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>

                      {openEndPicker && (
                        <DatePickerPopover
                          triggerRef={endButtonRef}
                          selectedDate={endDate}
                          otherDate={startDate}
                          isSelectingStart={false}
                          onSelect={(d) => {
                            setEndDate(d)
                            setOpenEndPicker(false)
                          }}
                          onClose={() => setOpenEndPicker(false)}
                        />
                      )}
                    </div>
                  </div>

                  {error ? <p className="text-xs text-destructive">{error}</p> : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveTask}
                    disabled={busy}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {busy ? 'Adding...' : 'Add task'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      resetTaskForm()
                      setAddingTask(false)
                    }}
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-border-hover hover:text-foreground-secondary"
                onClick={() => setAddingTask(true)}
                data-testid={`add-task-${column.id}`}
              >
                <Plus className="h-4 w-4" />
                Add task
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}

function DatePickerPopover({
  triggerRef,
  selectedDate,
  otherDate,
  isSelectingStart,
  onSelect,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  selectedDate: string
  otherDate?: string
  isSelectingStart: boolean
  onSelect: (dateStr: string) => void
  onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-')
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      }
    }
    return new Date()
  })

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const popoverWidth = 256
      let left = rect.left
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16
      }
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: left + window.scrollX,
      })
    }
  }, [triggerRef])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6

  const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = []

  const daysInPrevMonth = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    days.push({
      day: d,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false,
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: true,
    })
  }

  const totalCells = Math.ceil(days.length / 7) * 7
  const remaining = totalCells - days.length
  for (let i = 1; i <= remaining; i++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    days.push({
      day: i,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: false,
    })
  }

  return createPortal(
    <div
      ref={containerRef}
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
      className="fixed z-[9999] w-64 rounded-xl border border-border bg-background p-3 shadow-2xl"
    >
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewDate(new Date(year - 1, month, 1))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Previous Year"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Previous Month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="text-xs font-semibold text-foreground-secondary">
          {MONTH_NAMES[month]} {year}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Next Month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year + 1, month, 1))}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Next Year"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-muted-foreground">
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
        <span>Su</span>
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 text-center">
        {days.map((item) => {
          const isSelected = item.dateStr === selectedDate
          const isOther = item.dateStr === otherDate

          let inRange = false
          if (selectedDate && otherDate) {
            const start = isSelectingStart ? selectedDate : otherDate
            const end = isSelectingStart ? otherDate : selectedDate
            inRange = item.dateStr > start && item.dateStr < end
          }

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onSelect(item.dateStr)}
              className={`h-7 w-7 rounded-md text-xs transition ${
                isSelected
                  ? 'bg-zinc-50 font-bold text-zinc-950'
                  : isOther
                    ? 'bg-emerald-900/80 font-bold text-emerald-200 border border-emerald-500'
                    : inRange
                      ? 'bg-zinc-800/80 text-foreground-secondary'
                      : item.isCurrentMonth
                        ? 'text-foreground-secondary hover:bg-zinc-800'
                        : 'text-muted-foreground-subtle hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.day}
            </button>
          )
        })}
      </div>
    </div>,
    document.body
  )
}