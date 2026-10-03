import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@components/shared/ui/button'

interface CalendarHeaderProps {
  monthName: string
  year: number
  onToday: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function CalendarHeader({
  monthName,
  year,
  onToday,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-heading text-xl font-medium tracking-tight text-foreground-secondary">
          {monthName} {year}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToday}
          className="border border-border text-xs text-foreground-secondary hover:bg-zinc-800 hover:text-foreground"
        >
          Today
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onPrevMonth}
          className="h-8 w-8 p-0 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onNextMonth}
          className="h-8 w-8 p-0 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}