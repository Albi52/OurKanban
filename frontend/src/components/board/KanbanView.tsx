import { useEffect, useState, useRef, useCallback } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DragStart,
  type DroppableProvided,
  type DraggableProvided,
} from '@hello-pangea/dnd'
import { addColumn } from '@api/board/columnAPI'
import type { Member, ProjectSummary } from '../../types/workgroup'
import type { BoardColumn } from '../../types/board'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { BoardColumnView } from './kanban/BoardColumnView'

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
      onTasksChange([...tasks])
      return
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      if (draggingId && onMoveTask) {
        onMoveTask(draggingId, Number(destination.droppableId), 0, 0)
      }
      onTasksChange([...tasks])
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

      const sentSuccessfully = onMoveTask ? onMoveTask(draggableId, destColId, 0, 0) : true

      if (sentSuccessfully === false) {
        toast.error('No se pudo mover la tarea. Error de conexión con el servidor.')
      }

      onTasksChange([...tasks])
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
    }
  }

  function handleDeleteTask(taskId: string) {
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
                        onSelectTask={(task: Task) => onSelectTaskId(task.id)}
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