import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface DatePickerPopoverProps {
  triggerRef: React.RefObject<HTMLButtonElement | null>
  selectedDate: string
  otherDate?: string
  isSelectingStart: boolean
  onSelect: (dateStr: string) => void
  onClose: () => void
}

export function DatePickerPopover({
  triggerRef,
  selectedDate,
  otherDate,
  isSelectingStart,
  onSelect,
  onClose,
}: DatePickerPopoverProps) {
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