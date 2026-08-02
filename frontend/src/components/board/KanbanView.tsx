import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DroppableProvided,
  type DraggableProvided,
  type DroppableStateSnapshot,
  type DraggableStateSnapshot,
} from '@hello-pangea/dnd'
import { addColumn } from '../../api/columnAPI'
import type { ProjectSummary } from '../../types/workgroup'
import type { BoardColumn } from '../../types/board'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export interface Task {
  id: string
  columnId: number
  title: string
  description: string
  startDate: string
  endDate: string
  assigneeId?: number
  type?: 'task' | 'event'
}

interface Props {
  project: ProjectSummary
  columns: BoardColumn[]
  tasks: Task[]
  currentUser: { id: number; name: string }
  selectedTaskId: string | null
  onSelectTaskId: (taskId: string | null) => void
  onTasksChange: React.Dispatch<React.SetStateAction<Task[]>>
  onColumnsChanged: () => void
}

const defaultColumns: BoardColumn[] = [
  { id: -1, name: 'Undo', position: 10 },
  { id: -2, name: 'Doing', position: 20 },
  { id: -3, name: 'Done', position: 30 },
]

export function KanbanView({
  project,
  columns,
  tasks,
  currentUser,
  selectedTaskId,
  onSelectTaskId,
  onTasksChange,
  onColumnsChanged,
}: Props) {
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>(() =>
    columns.length > 0 ? columns : defaultColumns,
  )
  const [adding, setAdding] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [busy, setBusy] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null

  useEffect(() => {
    setBoardColumns(columns.length > 0 ? columns : defaultColumns)
  }, [columns])

  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title)
      setEditDesc(selectedTask.description)
      setEditStart(selectedTask.startDate)
      setEditEnd(selectedTask.endDate)
      setIsEditing(false)
    }
  }, [selectedTaskId, selectedTask])

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId, type } = result
    if (!destination) return

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
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

      onTasksChange((prevTasks) => {
        const updated = Array.from(prevTasks)
        const taskIndex = updated.findIndex((t) => t.id === draggableId)
        if (taskIndex === -1) return prevTasks

        const [movedTask] = updated.splice(taskIndex, 1)
        movedTask.columnId = destColId

        const destTasks = updated.filter((t) => t.columnId === destColId)
        const otherTasks = updated.filter((t) => t.columnId !== destColId)

        destTasks.splice(destination.index, 0, movedTask)
        return [...otherTasks, ...destTasks]
      })
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
    onTasksChange((current) => current.filter((task) => task.columnId !== columnId))
  }

  function handleCreateTask(columnId: number, task: Omit<Task, 'id' | 'columnId'>) {
    onTasksChange((current) => [
      ...current,
      {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        columnId,
        title: task.title,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
        assigneeId: currentUser.id,
        type: 'task',
      },
    ])
  }

  function handleDeleteTask(taskId: string) {
    onTasksChange((current) => current.filter((task) => task.id !== taskId))
    if (selectedTaskId === taskId) onSelectTaskId(null)
  }

  function handleSaveEdit() {
    if (!selectedTask) return

    onTasksChange((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? {
              ...t,
              title: editTitle.trim(),
              description: editDesc.trim(),
              startDate: editStart,
              endDate: editEnd,
            }
          : t
      )
    )
    setIsEditing(false)
  }

  // Comprueba si el usuario tiene permiso para modificar/borrar la tarea
  const canModifySelected =
    project.isLeader || (selectedTask && selectedTask.assigneeId === currentUser.id)

  return (
    <div className="flex h-full w-full flex-1 gap-4 overflow-hidden" data-testid="kanban-view">
      {/* Contenedor Kanban que siempre se expande al máximo disponible */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <DragDropContext onDragEnd={onDragEnd}>
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
                          tasks={tasks.filter(
                            (task) => task.columnId === column.id && task.type !== 'event'
                          )}
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
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                        <Input
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          placeholder="Column name"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                          className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                          data-testid="new-column-input"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddColumn}
                            disabled={busy || !newColumnName.trim()}
                            className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
                            data-testid="new-column-confirm"
                          >
                            {busy ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAdding(false)}
                            className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAdding(true)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
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
      </div>

      {/* Panel Lateral de Detalle */}
      {selectedTask && (
        <div className="w-80 shrink-0 h-full rounded-xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Task Info
              </span>
              <div className="flex items-center gap-1">
                {canModifySelected && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    title="Edit Task"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onSelectTaskId(null)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="font-medium text-zinc-400">Title</label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-400">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="mt-1 min-h-[90px] w-full rounded-md border border-zinc-800 bg-zinc-900 p-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-400">Start Date</label>
                  <Input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="font-medium text-zinc-400">End Date</label>
                  <Input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-100"
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="flex-1 bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="text-zinc-400"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{selectedTask.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap">
                    {selectedTask.description || (
                      <span className="italic text-zinc-600">No description provided.</span>
                    )}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
                  <div>
                    <span className="font-medium text-zinc-500 block">Start Date:</span>
                    <span className="text-zinc-200">{selectedTask.startDate || '-'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-500 block">End Date:</span>
                    <span className="text-zinc-200">{selectedTask.endDate || '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isEditing && canModifySelected && (
            <div className="pt-4 border-t border-zinc-800 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="w-full text-red-400 hover:bg-red-950/30 hover:text-red-300"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Task
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BoardColumnView({
  column,
  project,
  currentUser,
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
  currentUser: { id: number; name: string }
  tasks: Task[]
  selectedTaskId: string | null
  onAddTask: (columnId: number, task: Omit<Task, 'id' | 'columnId'>) => void
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

    setBusy(true)
    onAddTask(column.id, {
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate,
    })
    resetTaskForm()
    setAddingTask(false)
  }

  return (
    <div
      className="flex h-full w-[85vw] max-w-[320px] shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40"
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab text-zinc-600 hover:text-zinc-300 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <span className="font-heading text-sm font-medium uppercase tracking-[0.15em] text-zinc-200">
            {column.name}
          </span>
        </div>

        {canRemoveColumn && onRemoveColumn ? (
          <button
            type="button"
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-100"
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
                const canModify = project.isLeader || task.assigneeId === currentUser.id

                return (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(taskProvided: DraggableProvided, taskSnapshot: DraggableStateSnapshot) => (
                      <div
                        ref={taskProvided.innerRef}
                        {...taskProvided.draggableProps}
                        {...taskProvided.dragHandleProps}
                        onClick={() => onSelectTask(task)}
                        className={`group relative rounded-2xl border bg-zinc-950 p-4 transition cursor-pointer ${
                          isSelected
                            ? 'border-zinc-500 ring-2 ring-zinc-500/40 shadow-lg shadow-black/80'
                            : 'border-zinc-800 hover:border-zinc-700'
                        } ${taskSnapshot.isDragging ? 'shadow-lg shadow-black/60 ring-1 ring-zinc-700' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-100">{task.title}</p>
                            <p className="mt-2 text-sm leading-6 text-zinc-400 line-clamp-2">
                              {task.description || (
                                <span className="italic text-zinc-600">No description</span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            {canModify && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectTask(task)
                                  }}
                                  className="rounded-full p-1 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-900 hover:text-zinc-100"
                                  title="Edit Task"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="rounded-full p-1 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-zinc-900 hover:text-zinc-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteTask(task.id)
                                  }}
                                  aria-label={`Delete ${task.title}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 text-xs text-zinc-500">
                          <span>
                            <span className="font-medium text-zinc-400">Start:</span>{' '}
                            {task.startDate || '-'}
                          </span>
                          <span>
                            <span className="font-medium text-zinc-400">End:</span>{' '}
                            {task.endDate || '-'}
                          </span>
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/60 p-4 text-center text-xs text-zinc-500">
                No tasks yet. Add one to this column.
              </div>
            )}
            {provided.placeholder}

            {addingTask ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4">
                <div className="space-y-3">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-500"
                    data-testid="task-title-input"
                  />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description"
                    className="min-h-[90px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                  />

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <button
                        ref={startButtonRef}
                        type="button"
                        onClick={() => {
                          setOpenStartPicker((prev) => !prev)
                          setOpenEndPicker(false)
                        }}
                        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 hover:border-zinc-700"
                      >
                        <span className="truncate">{startDate || 'Start date'}</span>
                        <CalendarIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
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
                        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 hover:border-zinc-700"
                      >
                        <span className="truncate">{endDate || 'End date'}</span>
                        <CalendarIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
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

                  {error ? <p className="text-xs text-red-400">{error}</p> : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveTask}
                    disabled={busy}
                    className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
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
                    className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
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
      className="fixed z-[9999] w-64 rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl"
    >
      <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewDate(new Date(year - 1, month, 1))}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            title="Previous Year"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            title="Previous Month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="text-xs font-semibold text-zinc-200">
          {MONTH_NAMES[month]} {year}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            title="Next Month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year + 1, month, 1))}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            title="Next Year"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase text-zinc-500">
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
                      ? 'bg-zinc-800/80 text-zinc-200'
                      : item.isCurrentMonth
                        ? 'text-zinc-200 hover:bg-zinc-800'
                        : 'text-zinc-600 hover:bg-zinc-900'
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