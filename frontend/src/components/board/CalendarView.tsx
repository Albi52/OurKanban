import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Trash2,
  X,
  Pencil,
  Plus,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { Task } from './KanbanView'
import type { ProjectSummary } from '../../types/workgroup'

interface Props {
  project?: ProjectSummary
  tasks: Task[]
  currentUser: { id: number; name: string }
  selectedTaskId: string | null
  onSelectTaskId: (taskId: string | null) => void
  onDeleteTask?: (taskId: string) => void
  onUpdateTask?: (updatedTask: Task) => void
  onCreateTask?: (newTask: Task) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const TASK_COLORS = [
  'bg-indigo-950/80 border-indigo-700/80 text-indigo-200 hover:bg-indigo-900',
  'bg-emerald-950/80 border-emerald-700/80 text-emerald-200 hover:bg-emerald-900',
  'bg-amber-950/80 border-amber-700/80 text-amber-200 hover:bg-amber-900',
  'bg-rose-950/80 border-rose-700/80 text-rose-200 hover:bg-rose-900',
  'bg-cyan-950/80 border-cyan-700/80 text-cyan-200 hover:bg-cyan-900',
]

interface CalendarDay {
  date: Date
  dateStr: string
  day: number
  isCurrentMonth: boolean
}

export function CalendarView({
  project,
  tasks = [],
  currentUser,
  selectedTaskId,
  onSelectTaskId,
  onDeleteTask,
  onUpdateTask,
  onCreateTask,
}: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [isEditing, setIsEditing] = useState(false)
  const [addingEventDate, setAddingEventDate] = useState<string | null>(null)
  const [newEventTitle, setNewEventTitle] = useState('')

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null

  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')

  useEffect(() => {
    if (selectedTask) {
      setEditTitle(selectedTask.title)
      setEditDesc(selectedTask.description)
      setEditStart(selectedTask.startDate)
      setEditEnd(selectedTask.endDate)
      setIsEditing(false)
    }
  }, [selectedTaskId, selectedTask])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  let startingDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startingDayOfWeek === -1) startingDayOfWeek = 6

  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const allDays: CalendarDay[] = []

  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    const date = new Date(y, m, d)
    allDays.push({
      date,
      dateStr: formatDateString(date),
      day: d,
      isCurrentMonth: false,
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    allDays.push({
      date,
      dateStr: formatDateString(date),
      day: i,
      isCurrentMonth: true,
    })
  }

  const remainingCells = (7 - (allDays.length % 7)) % 7
  for (let i = 1; i <= remainingCells; i++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    const date = new Date(y, m, i)
    allDays.push({
      date,
      dateStr: formatDateString(date),
      day: i,
      isCurrentMonth: false,
    })
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  const todayStr = formatDateString(new Date())

  function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  function handleDropOnDay(targetDateStr: string, e: React.DragEvent) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId || !onUpdateTask) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Comprobar permisos antes de mover
    const canModify = project?.isLeader || task.assigneeId === currentUser.id
    if (!canModify) return

    // Si es un evento de un solo día, solo cambiamos la fecha manteniendo inicio = fin
    if (task.type === 'event') {
      onUpdateTask({
        ...task,
        startDate: targetDateStr,
        endDate: targetDateStr,
      })
      return
    }

    const currentStartStr = task.startDate || task.endDate || targetDateStr
    const currentEndStr = task.endDate || task.startDate || targetDateStr

    const currentStart = parseLocalDate(currentStartStr)
    const currentEnd = parseLocalDate(currentEndStr)
    const targetStart = parseLocalDate(targetDateStr)

    const durationMs = currentEnd.getTime() - currentStart.getTime()
    const newEnd = new Date(targetStart.getTime() + durationMs)

    onUpdateTask({
      ...task,
      startDate: formatDateString(targetStart),
      endDate: formatDateString(newEnd),
    })
  }

  function handleCreateEvent(dateStr: string) {
    if (!newEventTitle.trim() || !onCreateTask) return

    onCreateTask({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      columnId: -1,
      title: newEventTitle.trim(),
      description: 'Single day calendar event',
      startDate: dateStr,
      endDate: dateStr,
      assigneeId: currentUser.id,
      type: 'event',
    })

    setNewEventTitle('')
    setAddingEventDate(null)
  }

  function handleSaveEdit() {
    if (!selectedTask || !onUpdateTask) return

    onUpdateTask({
      ...selectedTask,
      title: editTitle.trim(),
      description: editDesc.trim(),
      startDate: editStart,
      endDate: editEnd,
    })
    setIsEditing(false)
  }

  const canModifySelected =
    project?.isLeader || (selectedTask && selectedTask.assigneeId === currentUser.id)

  return (
    <div className="flex h-full flex-1 gap-4 overflow-hidden" data-testid="calendar-view">
      <div className="flex flex-1 flex-col h-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 md:p-6 min-w-0">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-zinc-400" />
            <h2 className="font-heading text-xl font-medium tracking-tight text-zinc-100">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToday}
              className="border border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-zinc-800 pb-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 shrink-0">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="flex-1 grid grid-rows-none divide-y divide-zinc-800/60 border-b border-l border-r border-zinc-800/60 overflow-hidden">
          {weeks.map((week, weekIndex) => {
            const weekStart = week[0].dateStr
            const weekEnd = week[6].dateStr

            const weekTasks = tasks.filter((task) => {
              if (!task.startDate && !task.endDate) return false
              const start = task.startDate || task.endDate
              const end = task.endDate || task.startDate
              return start <= weekEnd && end >= weekStart
            })

            return (
              <div key={weekIndex} className="relative flex-1 min-h-[100px]">
                <div className="grid grid-cols-7 h-full auto-rows-fr divide-x divide-zinc-800/60">
                  {week.map((item) => {
                    const isToday = item.dateStr === todayStr
                    return (
                      <div
                        key={item.dateStr}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnDay(item.dateStr, e)}
                        className={`h-full p-2 transition-colors flex flex-col justify-between ${
                          item.isCurrentMonth ? 'bg-zinc-950/40' : 'bg-zinc-950/10 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              isToday
                                ? 'bg-zinc-50 font-bold text-zinc-950'
                                : item.isCurrentMonth
                                  ? 'text-zinc-300'
                                  : 'text-zinc-600'
                            }`}
                          >
                            {item.day}
                          </span>

                          <button
                            onClick={() => setAddingEventDate(item.dateStr)}
                            className="text-zinc-600 hover:text-zinc-300 p-0.5 rounded"
                            title="Add Event"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Input rápido para agregar evento en este día */}
                        {addingEventDate === item.dateStr && (
                          <div className="mt-1 z-20">
                            <Input
                              value={newEventTitle}
                              onChange={(e) => setNewEventTitle(e.target.value)}
                              placeholder="Event title..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateEvent(item.dateStr)
                                if (e.key === 'Escape') setAddingEventDate(null)
                              }}
                              className="h-6 text-[10px] bg-zinc-900 border-zinc-700 text-zinc-100 p-1"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="absolute left-0 right-0 top-8 space-y-1.5 px-1 pointer-events-none">
                  {weekTasks.map((task, taskIdx) => {
                    const isEvent = task.type === 'event'
                    const taskStart = task.startDate || task.endDate
                    const taskEnd = task.endDate || task.startDate

                    let startIndex = week.findIndex((d) => d.dateStr >= taskStart)
                    if (startIndex === -1) startIndex = 0

                    let endIndex = week.findIndex((d) => d.dateStr > taskEnd) - 1
                    if (endIndex === -2) endIndex = 6

                    const span = Math.max(1, endIndex - startIndex + 1)
                    const leftPercent = (startIndex / 7) * 100
                    const widthPercent = (span / 7) * 100

                    const isStart = taskStart >= weekStart
                    const isEnd = taskEnd <= weekEnd
                    const colorClass = TASK_COLORS[taskIdx % TASK_COLORS.length]
                    const isSelected = task.id === selectedTaskId
                    const canModify = project?.isLeader || task.assigneeId === currentUser.id

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('taskId', task.id)
                        }}
                        onClick={() => onSelectTaskId(task.id)}
                        className="relative h-6 pointer-events-auto cursor-pointer active:cursor-grabbing"
                        style={{
                          marginLeft: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        {/* Renderizado especial para EVENTOS de un solo día */}
                        {isEvent ? (
                          <div
                            className={`group flex h-full items-center justify-between rounded-full border border-purple-500/60 bg-purple-950/80 px-2.5 text-xs text-purple-200 shadow-sm transition hover:bg-purple-900/90 ${
                              isSelected ? 'ring-2 ring-purple-300 ring-offset-1 ring-offset-zinc-950 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                              <span className="truncate font-medium" title={task.title}>
                                {task.title}
                              </span>
                            </div>

                            {canModify && onDeleteTask && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteTask(task.id)
                                  if (selectedTaskId === task.id) onSelectTaskId(null)
                                }}
                                className="ml-1 hidden rounded p-0.5 opacity-80 hover:opacity-100 group-hover:block"
                                aria-label={`Delete ${task.title}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Renderizado estándar para TAREAS multidía */
                          <div
                            className={`group flex h-full items-center justify-between border px-2 text-xs transition ${colorClass} ${
                              isStart ? 'rounded-l-md' : 'rounded-l-none border-l-0'
                            } ${isEnd ? 'rounded-r-md' : 'rounded-r-none border-r-0'} ${
                              isSelected ? 'ring-2 ring-zinc-100 ring-offset-1 ring-offset-zinc-950 font-bold' : ''
                            }`}
                          >
                            <span className="truncate font-medium" title={task.title}>
                              {task.title}
                            </span>

                            {canModify && onDeleteTask && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteTask(task.id)
                                  if (selectedTaskId === task.id) onSelectTaskId(null)
                                }}
                                className="ml-1 hidden rounded p-0.5 opacity-80 hover:opacity-100 group-hover:block"
                                aria-label={`Delete ${task.title}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Panel Lateral Derecho para Calendario */}
      {selectedTask && (
        <div className="w-80 shrink-0 h-full rounded-xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {selectedTask.type === 'event' ? 'Event Info' : 'Task Info'}
              </span>
              <div className="flex items-center gap-1">
                {canModifySelected && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    title="Edit Item"
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
                  <label className="font-medium text-zinc-400">Date</label>
                  <Input
                    type="date"
                    value={editStart}
                    onChange={(e) => {
                      setEditStart(e.target.value)
                      if (selectedTask.type === 'event') setEditEnd(e.target.value)
                    }}
                    className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-100"
                  />
                </div>

                {selectedTask.type !== 'event' && (
                  <div>
                    <label className="font-medium text-zinc-400">End Date</label>
                    <Input
                      type="date"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="mt-1 border-zinc-800 bg-zinc-900 text-zinc-100"
                    />
                  </div>
                )}

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
                    <span className="font-medium text-zinc-500 block">
                      {selectedTask.type === 'event' ? 'Event Date:' : 'Start Date:'}
                    </span>
                    <span className="text-zinc-200">{selectedTask.startDate || '-'}</span>
                  </div>
                  {selectedTask.type !== 'event' && (
                    <div>
                      <span className="font-medium text-zinc-500 block">End Date:</span>
                      <span className="text-zinc-200">{selectedTask.endDate || '-'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isEditing && canModifySelected && onDeleteTask && (
            <div className="pt-4 border-t border-zinc-800 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDeleteTask(selectedTask.id)
                  onSelectTaskId(null)
                }}
                className="w-full text-red-400 hover:bg-red-950/30 hover:text-red-300"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete {selectedTask.type === 'event' ? 'Event' : 'Task'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}