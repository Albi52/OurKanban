import { useState } from 'react'
import type { Task } from './KanbanView'
import type { Member, ProjectSummary } from '../../types/workgroup'
import { CalendarHeader } from './calendar/CalendarHeader'
import { CalendarWeekRow } from './calendar/CalendarWeekRow'
import { ProjectActionsHeader } from './ProjectActionsHeader'

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

    if (type === 'task-left') {
      const task = tasks.find((t) => t.id === id)
      if (!task || !onUpdateTask) return

      const canModify = project?.isLeader || task.author?.id === currentUser.id
      if (!canModify) return

      onUpdateTask({
        ...task,
        startDate: targetDateStr, // Modifica solo el inicio al estirar el borde izquierdo
      })
      return
    }

    if (type === 'task-right') {
      const task = tasks.find((t) => t.id === id)
      if (!task || !onUpdateTask) return

      const canModify = project?.isLeader || task.author?.id === currentUser.id
      if (!canModify) return

      onUpdateTask({
        ...task,
        endDate: targetDateStr, // Modifica solo el fin al estirar el borde derecho
      })
      return
    }

    if (type === 'event') {
      const eventItem = events.find((ev) => ev.id === id)
      if (!eventItem || !onUpdateEvent) return

      // const canModify = project?.isLeader || eventItem.author?.id === currentUser.id
      // if (!canModify) return

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
        return 'border-t-4 border-t-red-500'
      case 'medium':
        return 'border-t-4 border-t-amber-500'
      case 'low':
      default:
        return 'border-t-4 border-t-emerald-500'
    }
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden" data-testid="calendar-view">
      <div className="flex flex-1 flex-col h-full rounded-xl border border-border bg-card/40 p-4 md:p-6 min-w-0 gap-4">
        
        {/* Cabecera superior idéntica al Kanban: "TABLERO CALENDARIO" y botones de acción */}
        <div className="flex items-center justify-between shrink-0 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            TABLERO CALENDARIO
          </span>
          <ProjectActionsHeader />
        </div>

        <CalendarHeader
          monthName={MONTH_NAMES[month]}
          year={year}
          onToday={handleToday}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
          {WEEKDAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="flex-1 grid grid-rows-none divide-y divide-zinc-800/60 border-b border-l border-r border-border/60 overflow-y-auto">
          {weeks.map((week, weekIndex) => (
            <CalendarWeekRow
              key={weekIndex}
              week={week}
              weekIndex={weekIndex}
              tasks={tasks}
              events={events}
              todayStr={todayStr}
              selectedItemId={selectedItemId}
              selectedItemType={selectedItemType}
              project={project}
              currentUser={currentUser}
              onSelectItem={onSelectItem}
              onDeleteTask={onDeleteTask}
              onDeleteEvent={onDeleteEvent}
              onCreateEvent={onCreateEvent}
              handleDragStartTask={handleDragStartTask}
              handleDragStartEvent={handleDragStartEvent}
              handleDragMoveEvent={handleDragMoveEvent}
              handleDropOnDay={handleDropOnDay}
              getTaskColorClass={getTaskColorClass}
              parseLocalDate={parseLocalDate}
              formatDateString={formatDateString}
            />
          ))}
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