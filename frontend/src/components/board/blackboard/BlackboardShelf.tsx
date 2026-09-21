import type { BlackboardElementDto } from '@app-types/blackboard'
import { BlackboardElementCard, type ElementHandlers } from './BlackboardElementCard'
import { Button } from '@components/shared/ui/button'
import { Plus, Layers } from 'lucide-react'

const CELL_SIZE = 96
const CELL_GAP = 8

interface Props {
  shelvedElements: BlackboardElementDto[]
  projectId: number
  canManage: (el: BlackboardElementDto) => boolean
  handlers: ElementHandlers
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onAddClick: () => void
}

export function BlackboardShelf({
  shelvedElements,
  projectId,
  canManage,
  handlers,
  onDragOver,
  onDrop,
  onAddClick,
}: Props) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="mx-4 mb-4 shrink-0 rounded-xl border border-dashed border-border bg-card/20 p-3"
      data-testid="blackboard-shelf"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          Shelf
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddClick}
          className="h-7 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add to shelf
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {shelvedElements.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground-subtle w-full">
            Drag elements here to set them aside, or add a new one directly.
          </p>
        )}
        {shelvedElements.map((el) => (
          <BlackboardElementCard
            key={el.id}
            element={el}
            projectId={projectId}
            canManage={canManage(el)}
            variant="shelf"
            style={{
              width: el.width * CELL_SIZE + (el.width - 1) * CELL_GAP,
              height: el.height * CELL_SIZE,
            }}
            handlers={handlers}
          />
        ))}
      </div>
    </div>
  )
}