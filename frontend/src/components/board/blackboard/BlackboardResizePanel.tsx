import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Shrink, X } from 'lucide-react'
import { Button } from '@components/shared/ui/button'
import type { GridEdge } from '@app-types/blackboard'

interface Props {
  shrinking: boolean
  onShrinkToFit: () => void
  onGrow: (kind: 'row' | 'col', edge: GridEdge) => void
  onClose: () => void
}

export function BlackboardResizePanel({ shrinking, onShrinkToFit, onGrow, onClose }: Props) {
  return (
    <div className="mb-4 flex w-fit items-center gap-2 rounded-xl border border-border bg-card/20 p-2 shrink-0 mx-auto">
      <Button
        size="sm"
        variant="outline"
        onClick={onShrinkToFit}
        disabled={shrinking}
        className="border-border bg-transparent text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground"
      >
        <Shrink className="mr-2 h-4 w-4" />
        {shrinking ? 'Fitting...' : 'Shrink to fit'}
      </Button>
      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground-subtle">Grow edge:</span>
      <EdgeButton icon={ArrowUp} label="Add row (top)" onClick={() => onGrow('row', 'TOP')} />
      <EdgeButton icon={ArrowDown} label="Add row (bottom)" onClick={() => onGrow('row', 'BOTTOM')} />
      <EdgeButton icon={ArrowLeft} label="Add column (left)" onClick={() => onGrow('col', 'LEFT')} />
      <EdgeButton icon={ArrowRight} label="Add column (right)" onClick={() => onGrow('col', 'RIGHT')} />
      <button
        type="button"
        onClick={onClose}
        title="Close"
        className="ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function EdgeButton({ icon: Icon, label, onClick }: { icon: typeof ArrowUp; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground-subtle hover:border-border-hover hover:text-foreground-secondary"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}