import { useEffect, useState } from 'react'
import { addColumn } from '../../api/columnAPI'
import type { ProjectSummary } from '../../types/workgroup'
import type { BoardColumn } from '../../types/board'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Task {
  id: string
  columnId: number
  title: string
  description: string
  startDate: string
  endDate: string
}

interface Props {
  project: ProjectSummary
  columns: BoardColumn[]
  onColumnsChanged: () => void
}

const defaultColumns: BoardColumn[] = [
  { id: -1, name: 'Undo', position: 10 },
  { id: -2, name: 'Doing', position: 20 },
  { id: -3, name: 'Done', position: 30 },
]

// ---------------------------------------------------------------------------
// NOTE FOR WHOEVER ADDS WEBSOCKETS / TASKS:
//
// `onColumnsChanged` currently just re-runs the parent's REST fetch after a
// successful add. Once a socket connection exists, the natural upgrade is:
//   - Keep this component's own "add column" form/REST call as-is — it's
//     still a normal user action, not a broadcast.
//   - The *incoming* update (this column now existing, from this user's own
//     action or someone else's) should instead arrive via a subscription in
//     the parent (`BoardPage`) and flow down through the `columns` prop,
//     rather than this component re-fetching over REST every time.
//   - Task cards belong inside `<BoardColumnView>` below.
// ---------------------------------------------------------------------------

export function KanbanView({ project, columns, onColumnsChanged }: Props) {
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>(() =>
    columns.length > 0 ? columns : defaultColumns,
  )
  const [tasks, setTasks] = useState<Task[]>([])
  const [adding, setAdding] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBoardColumns(columns.length > 0 ? columns : defaultColumns)
  }, [columns])

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
    setTasks((current) => current.filter((task) => task.columnId !== columnId))
  }

  function handleCreateTask(columnId: number, task: Omit<Task, 'id' | 'columnId'>) {
    setTasks((current) => [
      ...current,
      {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        columnId,
        title: task.title,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
      },
    ])
  }

  function handleDeleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  return (
    <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4" data-testid="kanban-view">
      {boardColumns.map((column) => (
        <div key={column.id} className="snap-center">
          <BoardColumnView
            column={column}
            tasks={tasks.filter((task) => task.columnId === column.id)}
            onAddTask={handleCreateTask}
            onDeleteTask={handleDeleteTask}
            onRemoveColumn={project.isLeader ? handleRemoveColumn : undefined}
            canRemoveColumn={project.isLeader && boardColumns.length > 1}
          />
        </div>
      ))}

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
  )
}

function BoardColumnView({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onRemoveColumn,
  canRemoveColumn,
}: {
  column: BoardColumn
  tasks: Task[]
  onAddTask: (columnId: number, task: Omit<Task, 'id' | 'columnId'>) => void
  onDeleteTask: (taskId: string) => void
  onRemoveColumn?: (columnId: number) => void
  canRemoveColumn: boolean
}) {
  const [addingTask, setAddingTask] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function resetTaskForm() {
    setTitle('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setError(null)
    setBusy(false)
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
      className="flex w-[85vw] max-w-[320px] shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40"
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="font-heading text-sm font-medium uppercase tracking-[0.15em] text-zinc-200">
          {column.name}
        </span>
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

      <div className="flex-1 space-y-4 p-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-100">{task.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {task.description || <span className="italic text-zinc-600">No description</span>}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-1 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-100"
                  onClick={() => onDeleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/60 p-4 text-center text-xs text-zinc-500">
            No tasks yet. Add one to this column.
          </div>
        )}

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
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-500"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-500"
                />
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
    </div>
  )
}