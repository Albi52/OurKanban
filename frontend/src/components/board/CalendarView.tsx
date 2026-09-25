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

export interface CalendarEvent {
  id: string
  title: string
  startDate: string
  endDate: string
  author: {
    id: number
    username: string
    profilePicture: string | null
  }
  type: 'event'
  positionX?: number
  positionY?: number
  moverName?: string
}

interface Props {
  project?: ProjectSummary
  tasks?: Task[]
  events?: CalendarEvent[]
  currentUser: Member
  selectedItemId: string | null
  selectedItemType: 'task' | 'event' | null
  onSelectItem: (id: string | null, type: 'task' | 'event' | null) => void
  onDeleteTask?: (taskId: string) => void
  onDeleteEvent?: (eventId: string) => void
  onUpdateTask?: (updatedTask: Task) => void
  onUpdateEvent?: (updatedEvent: CalendarEvent) => void
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
  events = [],
  currentUser,
  selectedItemId,
  selectedItemType,
  onSelectItem,
  onDeleteTask,
  onDeleteEvent,
  onUpdateTask,
  onUpdateEvent,
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

  function handleDragStartTask(task: Task, e: React.DragEvent) {
    if (task.moverName && task.moverName !== currentUser.username) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('type', 'task')
    e.dataTransfer.setData('id', task.id)
  }

  function handleDragStartEvent(eventItem: CalendarEvent, e: React.DragEvent) {
    if (eventItem.moverName && eventItem.moverName !== currentUser.username) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('type', 'event')
    e.dataTransfer.setData('id', eventItem.id)

    if (onUpdateEvent) {
      onUpdateEvent({
        ...eventItem,
        positionX: e.clientX,
        positionY: e.clientY,
      })
    }
  }

  function handleDragMoveEvent(eventItem: CalendarEvent, e: React.DragEvent) {
    if (!onUpdateEvent) return
    onUpdateEvent({
      ...eventItem,
      positionX: e.clientX,
      positionY: e.clientY,
    })
  }

  function handleDropOnDay(targetDateStr: string, e: React.DragEvent) {
    e.preventDefault()
    const type = e.dataTransfer.getData('type')
    const id = e.dataTransfer.getData('id')
    if (!id) return

    if (type === 'event') {
      const eventItem = events.find((ev) => ev.id === id)
      if (!eventItem || !onUpdateEvent) return

      const canModify = project?.isLeader || eventItem.author?.id === currentUser.id
      if (!canModify) return

      onUpdateEvent({
        ...eventItem,
        startDate: targetDateStr,
        endDate: targetDateStr,
        positionX: 0,
        positionY: 0,
      })
      return
    }

    if (type === 'task') {
      const task = tasks.find((t) => t.id === id)
      if (!task || !onUpdateTask) return

      const canModify = project?.isLeader || task.author?.id === currentUser.id
      if (!canModify) return

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
  }

  function getTaskColorClass(priority?: string) {
    switch (priority) {
      case 'high':
        return 'bg-red-950/80 border-red-700/80 text-white hover:bg-red-900'
      case 'medium':
        return 'bg-amber-950/80 border-amber-700/80 text-white hover:bg-amber-900'
      case 'low':
      default:
        return 'bg-emerald-950/80 border-emerald-700/80 text-white hover:bg-emerald-900'
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

        <div className="flex-1 grid grid-rows-none divide-y divide-zinc-800/60 border-b border-l border-r border-border/60 overflow-y-auto">
          {weeks.map((week, weekIndex) => {
            const weekStart = week[0].dateStr
            const weekEnd = week[6].dateStr

            const weekTasks = tasks.filter((task) => {
              if (!task.startDate && !task.endDate) return false
              const start = task.startDate || task.endDate
              const end = task.endDate || task.startDate
              return start <= weekEnd && end >= weekStart
            }).sort((a, b) => {
              const dateA = a.startDate || a.endDate || ''
              const dateB = b.startDate || b.endDate || ''
              return dateA.localeCompare(dateB)
            })

            return (
              <div
                key={weekIndex}
                className="relative min-h-[160px] h-auto flex flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const dayWidth = rect.width / 7
                  const dayIndex = Math.floor(x / dayWidth)
                  const clampedIndex = Math.min(Math.max(dayIndex, 0), 6)
                  handleDropOnDay(week[clampedIndex].dateStr, e)
                }}
              >
                <div className="absolute inset-0 grid grid-cols-7 divide-x divide-zinc-800/60 pointer-events-none">
                  {week.map((item) => (
                    <div
                      key={item.dateStr}
                      className={`h-full transition-colors ${
                        item.isCurrentMonth ? 'bg-background/40' : 'bg-background/10 text-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="relative z-10 grid grid-cols-7 divide-x divide-transparent p-2 pb-1 shrink-0">
                  {week.map((item) => {
                    const isToday = item.dateStr === todayStr
                    const dayEvents = events.filter((ev) => {
                      if (!ev.startDate && !ev.endDate) return false
                      const start = ev.startDate || ev.endDate
                      const end = ev.endDate || ev.startDate
                      return start <= item.dateStr && end >= item.dateStr
                    }).sort((a, b) => a.title.localeCompare(b.title))

                    return (
                      <div key={item.dateStr} className="flex flex-col gap-1.5 px-1">
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
                          <button
                            onClick={() => onCreateEvent?.(item.dateStr)}
                            title="Añadir evento"
                            aria-label="Añadir evento"
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/50 bg-purple-950/60 text-purple-300 hover:bg-purple-900 hover:text-purple-100 transition shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {dayEvents.map((eventItem, evIdx) => {
                          const isSelected = eventItem.id === selectedItemId && selectedItemType === 'event'
                          const canModify = project?.isLeader || eventItem.author?.id === currentUser.id

                          return (
                            <div
                              key={eventItem.id || evIdx}
                              draggable={!eventItem.moverName || eventItem.moverName === currentUser.username}
                              data-task-item="true"
                              onDragStart={(e) => handleDragStartEvent(eventItem, e)}
                              onDrag={(e) => handleDragMoveEvent(eventItem, e)}
                              onClick={() => onSelectItem(eventItem.id, 'event')}
                              className="relative h-6 pointer-events-auto cursor-pointer active:cursor-grabbing w-full"
                            >
                              <div
                                className={`group flex h-full items-center justify-between rounded-full border border-purple-500/60 bg-purple-950/80 px-2.5 text-xs text-purple-200 shadow-sm transition hover:bg-purple-900/90 overflow-hidden ${
                                  eventItem.moverName && eventItem.moverName !== currentUser.username ? 'cursor-not-allowed opacity-60 ring-1 ring-amber-500/60' : ''
                                } ${
                                  isSelected ? 'ring-2 ring-purple-300 ring-offset-1 ring-offset-zinc-950 font-bold' : ''
                                }`}
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <span className="h-2 w-2 rounded-full bg-purple-400 shrink-0" />
                                  <span className="truncate font-medium" title={eventItem.title}>
                                    {eventItem.title}
                                  </span>
                                  {eventItem.moverName && eventItem.moverName !== currentUser.username && (
                                    <span
                                      className="ml-1 shrink-0 text-[10px] text-amber-300"
                                      title={`Moviendo por ${eventItem.moverName}`}
                                    >
                                      {eventItem.moverName} moviendo
                                    </span>
                                  )}
                                </div>

                                {canModify && onDeleteEvent && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDeleteEvent(eventItem.id)
                                      if (selectedItemId === eventItem.id && selectedItemType === 'event') {
                                        onSelectItem(null, null)
                                      }
                                    }}
                                    className="ml-1 hidden rounded p-0.5 opacity-80 hover:opacity-100 group-hover:block shrink-0"
                                    aria-label={`Delete ${eventItem.title}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>

                <div className="relative z-20 flex flex-col gap-1.5 px-2 pb-3 mt-1 pointer-events-auto">
                  {weekTasks.map((task, taskIdx) => {
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
                    const isSelected = task.id === selectedItemId && selectedItemType === 'task'
                    const canModify = project?.isLeader || task.author?.id === currentUser.id

                    return (
                      <div
                        key={task.id || taskIdx}
                        draggable={!task.moverName || task.moverName === currentUser.username}
                        data-task-item="true"
                        onDragStart={(e) => handleDragStartTask(task, e)}
                        onClick={() => onSelectItem(task.id, 'task')}
                        className="relative h-6 pointer-events-auto cursor-pointer active:cursor-grabbing max-w-full"
                        style={{
                          marginLeft: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        <div
                          className={`group flex h-full items-center justify-between border px-2 text-xs transition overflow-hidden text-white ${colorClass} ${
                            isStart ? 'rounded-l-md' : 'rounded-l-none border-l-0'
                          } ${isEnd ? 'rounded-r-md' : 'rounded-r-none border-r-0'} ${
                            isSelected ? 'ring-2 ring-zinc-100 ring-offset-1 ring-offset-zinc-950 font-bold' : ''
                          }`}
                        >
                          <span className="truncate font-medium text-white" title={task.title}>
                            {task.title}
                          </span>

                          {canModify && onDeleteTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteTask(task.id)
                                if (selectedItemId === task.id && selectedItemType === 'task') {
                                  onSelectItem(null, null)
                                }
                              }}
                              className="ml-1 hidden rounded p-0.5 opacity-80 hover:opacity-100 group-hover:block shrink-0 text-white"
                              aria-label={`Delete ${task.title}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {events
                  .filter(
                    (eventItem) =>
                      eventItem.moverName &&
                      eventItem.moverName !== currentUser.username &&
                      ((eventItem.positionX ?? 0) !== 0 || (eventItem.positionY ?? 0) !== 0),
                  )
                  .map((eventItem) => (
                    <div
                      key={`live-event-${eventItem.id}`}
                      className="pointer-events-none fixed z-[1000] w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-500/80 bg-zinc-950/95 p-3 shadow-2xl shadow-amber-500/20 ring-2 ring-amber-500/40"
                      style={{
                        left: `${eventItem.positionX}px`,
                        top: `${eventItem.positionY}px`,
                      }}
                    >
                      <span className="text-[11px] font-semibold text-amber-300">
                        {eventItem.moverName} está moviendo
                      </span>
                      <p className="truncate text-sm font-semibold text-foreground-secondary">{eventItem.title}</p>
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