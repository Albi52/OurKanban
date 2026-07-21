import { useState } from 'react'
import { addColumn } from '../../api/columnAPI'
import type { ProjectSummary } from '../../types/workgroup'
import type { BoardColumn } from '../../types/board'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  project: ProjectSummary
  columns: BoardColumn[]
  onColumnsChanged: () => void
}

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
//   - Task cards belong inside `<BoardColumnView>` below, in the marked spot.
// ---------------------------------------------------------------------------

export function KanbanView({ project, columns, onColumnsChanged }: Props) {
  const [adding, setAdding] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAddColumn() {
    if (!newColumnName.trim()) return

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
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-4" data-testid="kanban-view">
      {columns.map((col) => (
        <BoardColumnView key={col.id} column={col} />
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

function BoardColumnView({ column }: { column: BoardColumn }) {
  return (
    <div
      className="flex w-80 shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40"
      data-testid={`column-${column.id}`}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="font-heading text-sm font-medium uppercase tracking-[0.15em] text-zinc-200">
          {column.name}
        </span>
      </div>

      <div className="flex-1 space-y-3 p-3">
        {/* TODO(tasks): map task cards for this column here, e.g.
            tasks.filter(t => t.columnId === column.id).map(...) */}
        <div className="rounded-md border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-600">
          No tasks yet
        </div>
      </div>
    </div>
  )
}