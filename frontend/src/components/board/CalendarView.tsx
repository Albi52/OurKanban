import { CalendarDays } from 'lucide-react'

// ---------------------------------------------------------------------------
// NOTE FOR WHOEVER ADDS WEBSOCKETS / TASKS:
//
// This is a placeholder. A real calendar needs dated tasks to plot, which
// don't exist yet (no Task CRUD built). Once tasks exist with a date field,
// this component should:
//   - Accept a `tasks: Task[]` prop (same shape used by KanbanView, once
//     that exists) from `BoardPage`, rather than fetching its own data.
//   - Render a month grid and place each task under its date.
//   - Update live the same way KanbanView will — via the shared `tasks`
//     state in `BoardPage`, fed by the websocket subscription, not by this
//     component polling or re-fetching on its own.
//
// A full month-grid calendar was sketched in an earlier draft (CalendarView
// from the mockup port) if a visual reference is useful when building the
// real version.
// ---------------------------------------------------------------------------

export function CalendarView() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-16 text-center text-zinc-500"
      data-testid="calendar-view"
    >
      <CalendarDays className="h-8 w-8 text-zinc-600" />
      <p className="text-sm">Calendar view is coming soon — it'll show tasks by date once tasks exist.</p>
    </div>
  )
}