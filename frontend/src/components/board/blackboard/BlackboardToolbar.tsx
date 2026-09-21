import { Button } from '@components/shared/ui/button'
import { Plus, Maximize2, X, ZoomIn, ZoomOut, Scan } from 'lucide-react'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 2

interface Props {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onAutoZoom: () => void
  resizePanelOpen: boolean
  onToggleResizePanel: () => void
  placingActive: boolean
  onStartPlacing: () => void
  onCancelPlacing: () => void
}

export function BlackboardToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onAutoZoom,
  resizePanelOpen,
  onToggleResizePanel,
  placingActive,
  onStartPlacing,
  onCancelPlacing,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 shrink-0">
      <p className="text-xs text-muted-foreground">
        Click two cells to place an element. Drag to move, drag the corner to resize.
      </p>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleResizePanel}
          className={`border-border bg-transparent text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground ${
            resizePanelOpen ? 'border-border-hover bg-accent' : ''
          }`}
        >
          <Maximize2 className="mr-2 h-4 w-4" />
          Resize grid
        </Button>

        <div className="flex items-center gap-1 rounded-md border border-border bg-card/20 p-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= ZOOM_MIN}
            title="Zoom out"
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground disabled:opacity-30"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-[10px] text-muted-foreground-subtle">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= ZOOM_MAX}
            title="Zoom in"
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground disabled:opacity-30"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onAutoZoom}
            title="Fit to view"
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-foreground"
          >
            <Scan className="h-3.5 w-3.5" />
          </button>
        </div>

        {placingActive ? (
          <Button size="sm" variant="ghost" onClick={onCancelPlacing} className="text-muted-foreground">
            <X className="mr-2 h-4 w-4" />
            Cancel placement
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onStartPlacing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="add-element-btn"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add element
          </Button>
        )}
      </div>
    </div>
  )
}