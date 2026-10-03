import { useState, useRef } from 'react'
import { Droppable, Draggable, type DroppableProvided, type DraggableProvided, type DroppableStateSnapshot, type DraggableStateSnapshot } from '@hello-pangea/dnd'
import type { Member, ProjectSummary } from '../../../types/workgroup'
import type { BoardColumn } from '../../../types/board'
import type { Task, Priority } from '../KanbanView'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { Plus, Trash2, GripVertical, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react'
import { DatePickerPopover } from './DatePickerPopover'

interface BoardColumnViewProps {
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
}

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

export function BoardColumnView({
  column,
  currentUser,
  groupMembers = [],
  tasks,
  selectedTaskId,
  onAddTask,
  onSelectTask,
  onRemoveColumn,
  canRemoveColumn,
  dragHandleProps,
}: BoardColumnViewProps) {
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