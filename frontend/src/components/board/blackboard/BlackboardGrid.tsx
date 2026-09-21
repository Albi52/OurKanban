import type { BlackboardDto, BlackboardElementDto, PlacedBlackboardElement, PlacementRect } from '@app-types/blackboard'
import { BlackboardElementCard, type ElementHandlers } from './BlackboardElementCard'

const CELL_SIZE = 96
const CELL_GAP = 8

interface Props {
  board: BlackboardDto
  placedElements: PlacedBlackboardElement[]
  projectId: number
  canManage: (el: BlackboardElementDto) => boolean
  zoom: number
  gridRef: React.RefObject<HTMLDivElement> 
  placingActive: boolean
  placeAnchor: { row: number; col: number } | null
  previewRect: PlacementRect | null
  onCellClick: (row: number, col: number) => void
  onCellHover: (row: number, col: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onStartMove: (e: React.MouseEvent, el: PlacedBlackboardElement) => void
  onStartResize: (e: React.MouseEvent, el: PlacedBlackboardElement) => void
  onSendToShelf: (elementId: number) => void
  handlers: ElementHandlers
}

export function BlackboardGrid({
  board,
  placedElements,
  projectId,
  canManage,
  zoom,
  gridRef,
  placingActive,
  placeAnchor,
  previewRect,
  onCellClick,
  onCellHover,
  onDragOver,
  onDrop,
  onStartMove,
  onStartResize,
  onSendToShelf,
  handlers,
}: Props) {
  const rows = board.maxRow - board.minRow + 1
  const cols = board.maxCol - board.minCol + 1

  return (
    <div
      ref={gridRef}
      className="relative grid rounded-xl border border-border bg-card/20 p-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
        gap: `${CELL_GAP}px`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const rowIndex = board.minRow + r
          const colIndex = board.minCol + c
          const isAnchor = placeAnchor?.row === rowIndex && placeAnchor?.col === colIndex
          const inPreview =
            previewRect &&
            rowIndex >= previewRect.row &&
            rowIndex < previewRect.row + previewRect.height &&
            colIndex >= previewRect.col &&
            colIndex < previewRect.col + previewRect.width

          return (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              style={{ gridColumn: c + 1, gridRow: r + 1 }}
              onClick={() => onCellClick(rowIndex, colIndex)}
              onMouseEnter={() => placingActive && placeAnchor && onCellHover(rowIndex, colIndex)}
              className={`rounded-md border border-dashed transition-colors ${
                placingActive ? 'cursor-crosshair' : ''
              } ${
                inPreview
                  ? 'border-primary bg-primary/10'
                  : isAnchor
                    ? 'border-primary bg-primary/20'
                    : 'border-border/40 hover:border-border-hover'
              }`}
            />
          )
        })
      )}

      {placedElements.map((el) => (
        <BlackboardElementCard
          key={el.id}
          element={el}
          projectId={projectId}
          canManage={canManage(el)}
          variant="grid"
          style={{
            gridColumn: `${el.col - board.minCol + 1} / span ${el.width}`,
            gridRow: `${el.row - board.minRow + 1} / span ${el.height}`,
          }}
          onMouseDownMove={(e) => onStartMove(e, el)}
          onMouseDownResize={(e) => onStartResize(e, el)}
          onSendToShelf={() => onSendToShelf(el.id)}
          handlers={handlers}
        />
      ))}
    </div>
  )
}