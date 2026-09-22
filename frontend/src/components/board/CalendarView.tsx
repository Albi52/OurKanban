import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Trash2,
  Plus,
} from 'lucide-react'
import { Button } from '@components/shared/ui/button'
import type { Task } from './KanbanView'
import type { Member, ProjectSummary } from '../../types/workgroup'

interface Props {
  project?: ProjectSummary
  tasks: Task[]
  currentUser: Member
  selectedTaskId: string | null
  onSelectTaskId: (taskId: string | null) => void
  onDeleteTask?: (taskId: string) => void
  onUpdateTask?: (updatedTask: Task) => void
  onCreateEvent?: (date: string) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
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
  onCreateEvent,
}: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

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

  function handleDragStart(task: Task, e: React.DragEvent) {
    if (task.moverName && task.moverName !== currentUser.username) {
      e.preventDefault()
      return
    }

    e.dataTransfer.setData('taskId', task.id)

    if (task.type === 'event' && onUpdateTask) {
      onUpdateTask({
        ...task,
        positionX: e.clientX,
        positionY: e.clientY,
      })
    }
  }
  function handleDragMove(task: Task, e: React.DragEvent) {
    if (task.type !== 'event' || !onUpdateTask) return

    onUpdateTask({
      ...task,
      positionX: e.clientX,
      positionY: e.clientY,
    })
  }

  function handleDropOnDay(targetDateStr: string, e: React.DragEvent) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId || !onUpdateTask) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const canModify = project?.isLeader || task.author?.id === currentUser.id
    if (!canModify) return

    if (task.type === 'event') {
      onUpdateTask({
        ...task,
        startDate: targetDateStr,
        endDate: targetDateStr,
        positionX: 0,
        positionY: 0,
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

  // Asignar colores según la prioridad
  function getTaskColorClass(priority?: string) {
    switch (priority) {
      case 'high':
        return 'bg-red-950/80 border-red-700/80 text-red-200 hover:bg-red-900'
      case 'medium':
        return 'bg-amber-950/80 border-amber-700/80 text-warning-foreground hover:bg-amber-900'
      case 'low':
      default:
        return 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200 hover:bg-emerald-900'
    }
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden" data-testid="calendar-view">
      <div className="flex flex-1 flex-col h-full rounded-xl border border-border bg-card/40 p-4 md:p-6 min-w-0">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-heading text-xl font-medium tracking-tight text-foreground-secondary">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToday}
              className="border border-border text-xs text-foreground-secondary hover:bg-zinc-800 hover:text-foreground"
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="flex-1 grid grid-rows-none divide-y divide-zinc-800/60 border-b border-l border-r border-border/60 overflow-hidden">
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
                          item.isCurrentMonth ? 'bg-background/40' : 'bg-background/10 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              isToday
                                ? 'bg-zinc-50 font-bold text-zinc-950'
                                : item.isCurrentMonth
                                  ? 'text-foreground-secondary'
                                  : 'text-muted-foreground-subtle'
                            }`}
                          >
                            {item.day}
                          </span>

                        </div>
                        <button
                          onClick={() => onCreateEvent?.(item.dateStr)}
                          className="mt-auto flex w-full items-center justify-center gap-1 rounded border border-purple-500/50 bg-purple-950/40 py-0.5 text-[10px] text-purple-300 hover:bg-purple-900/70 hover:text-purple-100"
                          title="Add Event"
                        >
                          <Plus className="h-3 w-3" />
                          Event
                        </button>
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
                    const colorClass = getTaskColorClass(task.priority)
                    const isSelected = task.id === selectedTaskId
                    const canModify = project?.isLeader || task.author?.id === currentUser.id

                    return (
                      <div
                        key={task.id || taskIdx}
                        draggable={!task.moverName || task.moverName === currentUser.username}
                        data-task-item="true"
                        onDragStart={(e) => handleDragStart(task, e)}
                        onDrag={(e) => handleDragMove(task, e)}
                        onClick={() => onSelectTaskId(task.id)}
                        className="relative h-6 pointer-events-auto cursor-pointer active:cursor-grabbing"
                        style={{
                          marginLeft: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        {isEvent ? (
                          <div
                            className={`group flex h-full items-center justify-between rounded-full border border-purple-500/60 bg-purple-950/80 px-2.5 text-xs text-purple-200 shadow-sm transition hover:bg-purple-900/90 ${
                              task.moverName && task.moverName !== currentUser.username ? 'cursor-not-allowed opacity-60 ring-1 ring-amber-500/60' : ''
                            } ${
                              isSelected ? 'ring-2 ring-purple-300 ring-offset-1 ring-offset-zinc-950 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                              <span className="truncate font-medium" title={task.title}>
                                {task.title}
                              </span>
                              {task.moverName && task.moverName !== currentUser.username && (
                                <span
                                  className="ml-1 shrink-0 text-[10px] text-amber-300"
                                  title={`Moviendo por ${task.moverName}`}
                                >
                                  {task.moverName} moviendo
                                </span>
                              )}
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
                {tasks
                  .filter(
                    (task) =>
                      task.type === 'event' &&
                      task.moverName &&
                      task.moverName !== currentUser.username &&
                      ((task.positionX ?? 0) !== 0 || (task.positionY ?? 0) !== 0),
                  )
                  .map((task) => (
                    <div
                      key={`live-event-${task.id}`}
                      className="pointer-events-none fixed z-[1000] w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-500/80 bg-zinc-950/95 p-3 shadow-2xl shadow-amber-500/20 ring-2 ring-amber-500/40"
                      style={{
                        left: `${task.positionX}px`,
                        top: `${task.positionY}px`,
                      }}
                    >
                      <span className="text-[11px] font-semibold text-amber-300">
                        {task.moverName} está moviendo
                      </span>
                      <p className="truncate text-sm font-semibold text-foreground-secondary">{task.title}</p>
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}