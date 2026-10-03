import { Plus, Trash2 } from 'lucide-react'
import type { Task } from '../KanbanView'
import type { CalendarEvent } from '../CalendarView'
import type { Member, ProjectSummary } from '../../../types/workgroup'

interface CalendarDay {
  date: Date
  dateStr: string
  day: number
  isCurrentMonth: boolean
}

interface CalendarWeekRowProps {
  week: CalendarDay[]
  weekIndex: number
  tasks: Task[]
  events: CalendarEvent[]
  todayStr: string
  selectedItemId: string | null
  selectedItemType: 'task' | 'event' | null
  project?: ProjectSummary
  currentUser: Member
  onSelectItem: (id: string | null, type: 'task' | 'event' | null) => void
  onDeleteTask?: (taskId: string) => void
  onDeleteEvent?: (eventId: string) => void
  onCreateEvent?: (date: string) => void
  onUpdateEvent?: (updatedEvent: CalendarEvent) => void
  onUpdateTask?: (updatedTask: Task) => void
  handleDragStartTask: (task: Task, e: React.DragEvent) => void
  handleDragStartEvent: (eventItem: CalendarEvent, e: React.DragEvent) => void
  handleDragMoveEvent: (eventItem: CalendarEvent, e: React.DragEvent) => void
  handleDropOnDay: (targetDateStr: string, e: React.DragEvent) => void
  getTaskColorClass: (priority?: string) => string
  parseLocalDate: (dateStr: string) => Date
  formatDateString: (date: Date) => string
}

export function CalendarWeekRow({
  week,
  weekIndex,
  tasks,
  events,
  todayStr,
  selectedItemId,
  selectedItemType,
  project,
  currentUser,
  onSelectItem,
  onDeleteTask,
  onDeleteEvent,
  onCreateEvent,
  handleDragStartTask,
  handleDragStartEvent,
  handleDragMoveEvent,
  handleDropOnDay,
  getTaskColorClass,
}: CalendarWeekRowProps) {
  const weekStart = week[0].dateStr
  const weekEnd = week[6].dateStr

  const weekTasks = tasks
    .filter((task) => {
      if (!task.startDate && !task.endDate) return false
      const start = task.startDate || task.endDate
      const end = task.endDate || task.startDate
      return start <= weekEnd && end >= weekStart
    })
    .sort((a, b) => {
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
          const dayEvents = events
            .filter((ev) => {
              if (!ev.startDate && !ev.endDate) return false
              const start = ev.startDate || ev.endDate
              const end = ev.endDate || ev.startDate
              return start <= item.dateStr && end >= item.dateStr
            })
            .sort((a, b) => a.title.localeCompare(b.title))

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
                  type="button"
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
                        eventItem.moverName && eventItem.moverName !== currentUser.username
                          ? 'cursor-not-allowed opacity-60 ring-1 ring-amber-500/60'
                          : ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-purple-300 ring-offset-1 ring-offset-zinc-950 font-bold'
                          : ''
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
}