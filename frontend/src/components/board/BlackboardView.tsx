import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProjectSummary, Member } from '@app-types/workgroup'
import type { BlackboardDto, BlackboardElementDto, ElementType, GridEdge } from '@app-types/blackboard'
import {
  getBlackboard,
  addElement,
  updateGeometry,
  updateContent,
  uploadElementImage,
  deleteElement,
  addRow,
  unstageElement,
  addColumn,
  shrinkToFit,
} from '@api/board/blackboardAPI'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Image as ImageIcon, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, GripVertical, Layers,Maximize2, Shrink } from 'lucide-react'

const CELL_SIZE = 96
const CELL_GAP = 8

interface Props {
  project: ProjectSummary
  currentUser: Member
}

interface Rect {
  row: number
  col: number
  width: number
  height: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function BlackboardView({ project, currentUser }: Props) {
  const [board, setBoard] = useState<BlackboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [placingActive, setPlacingActive] = useState(false)
  const [placeAnchor, setPlaceAnchor] = useState<{ row: number; col: number } | null>(null)
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)
  const [pendingRect, setPendingRect] = useState<Rect | null>(null)

  const [pendingType, setPendingType] = useState<ElementType>('TEXT')
  const [pendingText, setPendingText] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

  const [shelfFormOpen, setShelfFormOpen] = useState(false)
  const [shelfWidth, setShelfWidth] = useState(2)
  const [shelfHeight, setShelfHeight] = useState(2)
  const gridRef = useRef<HTMLDivElement>(null)

    const [resizePanelOpen, setResizePanelOpen] = useState(false)
  const [shrinking, setShrinking] = useState(false)

  const [editingElementId, setEditingElementId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [project.id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getBlackboard(project.id)
      setBoard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blackboard')
    } finally {
      setLoading(false)
    }
  }
  const placedElements = board?.elements.filter((e) => e.row !== null && e.col !== null) ?? []
  const shelvedElements = board?.elements.filter((e) => e.row === null || e.col === null) ?? []

  const previewRect = useMemo<Rect | null>(() => {
    if (!placingActive || !placeAnchor || !hoverCell) return null
    return {
      row: Math.min(placeAnchor.row, hoverCell.row),
      col: Math.min(placeAnchor.col, hoverCell.col),
      width: Math.abs(placeAnchor.col - hoverCell.col) + 1,
      height: Math.abs(placeAnchor.row - hoverCell.row) + 1,
    }
  }, [placingActive, placeAnchor, hoverCell])

    function asPlaced(el: BlackboardElementDto) {
    return el as BlackboardElementDto & { row: number; col: number }
  }

  function canManage(el: BlackboardElementDto) {
    return project.isLeader || el.creatorId === currentUser.id
  }

  function handleCellClick(row: number, col: number) {
    if (!placingActive) return
    if (!placeAnchor) {
      setPlaceAnchor({ row, col })
      return
    }
    const rect: Rect = {
      row: Math.min(placeAnchor.row, row),
      col: Math.min(placeAnchor.col, col),
      width: Math.abs(placeAnchor.col - col) + 1,
      height: Math.abs(placeAnchor.row - row) + 1,
    }
    setPendingRect(rect)
    setPlaceAnchor(null)
    setHoverCell(null)
    setPlacingActive(false)
  }

  function cancelPlacement() {
    setPlacingActive(false)
    setPlaceAnchor(null)
    setHoverCell(null)
    setPendingRect(null)
    setPendingText('')
    setPendingFile(null)
    setPendingType('TEXT')
  }

  async function handleCreateElement() {
    if (!pendingRect) return
    if (pendingType !== 'IMAGE' && !pendingText.trim()) {
      toast.error('Add some text, or switch to an image element')
      return
    }
    setCreating(true)
    let created: BlackboardElementDto | null = null
    try {
      created = await addElement(project.id, {
        row: pendingRect.row,
        col: pendingRect.col,
        width: pendingRect.width,
        height: pendingRect.height,
        type: pendingType,
        textContent: pendingType === 'IMAGE' ? undefined : pendingText.trim(),
      })

      if (pendingFile && pendingType !== 'TEXT') {
        created = await uploadElementImage(project.id, created.id, pendingFile)
      }

      setBoard((prev) => (prev ? { ...prev, elements: [...prev.elements, created!] } : prev))
      cancelPlacement()
    } catch (err) {

      toast.error(err instanceof Error ? err.message : 'Failed to add element')
      if (created) {
        // The element record was created but the image failed to attach —
        // roll it back rather than leaving an incomplete element on the board.
        deleteElement(project.id, created.id).catch(() => { })
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteElement(el: BlackboardElementDto) {
    try {
      await deleteElement(project.id, el.id)
      setBoard((prev) => (prev ? { ...prev, elements: prev.elements.filter((e) => e.id !== el.id) } : prev))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete element')
    }
  }

  function startEditText(el: BlackboardElementDto) {
    setEditingElementId(el.id)
    setEditText(el.textContent ?? '')
  }

  async function saveEditText(el: BlackboardElementDto) {
    try {
      const updated = await updateContent(project.id, el.id, { textContent: editText.trim() })
      setBoard((prev) =>
        prev ? { ...prev, elements: prev.elements.map((e) => (e.id === updated.id ? updated : e)) } : prev
      )
      setEditingElementId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update text')
    }
  }

  async function handleImageChange(el: BlackboardElementDto, file: File | null) {
    if (!file) return
    try {
      const updated = await uploadElementImage(project.id, el.id, file)
      setBoard((prev) =>
        prev ? { ...prev, elements: prev.elements.map((e) => (e.id === updated.id ? updated : e)) } : prev
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image')
    }
  }

  function startMove(e: React.MouseEvent, el: BlackboardElementDto) {
    if (!canManage(el) || editingElementId === el.id) return
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startRow = asPlaced(el).row
    const startCol = asPlaced(el).col
    let currentRow = startRow
    let currentCol = startCol

    function onMove(ev: MouseEvent) {
      if (!board) return
      const deltaCol = Math.round((ev.clientX - startX) / (CELL_SIZE + CELL_GAP))
      const deltaRow = Math.round((ev.clientY - startY) / (CELL_SIZE + CELL_GAP))
      const newRow = clamp(startRow + deltaRow, board.minRow, board.maxRow - el.height + 1)
      const newCol = clamp(startCol + deltaCol, board.minCol, board.maxCol - el.width + 1)
      if (newRow !== currentRow || newCol !== currentCol) {
        currentRow = newRow
        currentCol = newCol
        setBoard((prev) =>
          prev
            ? { ...prev, elements: prev.elements.map((e) => (e.id === el.id ? { ...e, row: newRow, col: newCol } : e)) }
            : prev
        )
      }
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (currentRow === startRow && currentCol === startCol) return
      updateGeometry(project.id, el.id, { row: currentRow, col: currentCol, width: el.width, height: el.height })
        .then((updated) => {
          setBoard((prev) =>
            prev ? { ...prev, elements: prev.elements.map((e) => (e.id === updated.id ? updated : e)) } : prev
          )
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to move element')
          setBoard((prev) =>
            prev ? { ...prev, elements: prev.elements.map((e) => (e.id === el.id ? el : e)) } : prev
          )
        })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startResize(e: React.MouseEvent, el: BlackboardElementDto) {
    if (!canManage(el)) return
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = el.width
    const startHeight = el.height
    let currentWidth = startWidth
    let currentHeight = startHeight

    function onMove(ev: MouseEvent) {
      if (!board) return
      const deltaCol = Math.round((ev.clientX - startX) / (CELL_SIZE + CELL_GAP))
      const deltaRow = Math.round((ev.clientY - startY) / (CELL_SIZE + CELL_GAP))
      const newWidth = clamp(startWidth + deltaCol, 1, board.maxCol - asPlaced(el).col + 1)
      const newHeight = clamp(startHeight + deltaRow, 1, board.maxRow - asPlaced(el).row + 1)
      if (newWidth !== currentWidth || newHeight !== currentHeight) {
        currentWidth = newWidth
        currentHeight = newHeight
        setBoard((prev) =>
          prev
            ? {
              ...prev,
              elements: prev.elements.map((e) =>
                e.id === el.id ? { ...e, width: newWidth, height: newHeight } : e
              ),
            }
            : prev
        )
      }
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (currentWidth === startWidth && currentHeight === startHeight) return
      updateGeometry(project.id, el.id, { row: asPlaced(el).row, col: asPlaced(el).col, width: currentWidth, height: currentHeight })
        .then((updated) => {
          setBoard((prev) =>
            prev ? { ...prev, elements: prev.elements.map((e) => (e.id === updated.id ? updated : e)) } : prev
          )
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to resize element')
          setBoard((prev) =>
            prev ? { ...prev, elements: prev.elements.map((e) => (e.id === el.id ? el : e)) } : prev
          )
        })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  async function handleGrow(kind: 'row' | 'col', edge: GridEdge) {
    try {
      const updated = kind === 'row' ? await addRow(project.id, edge) : await addColumn(project.id, edge)
      setBoard(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resize the board')
    }
  }
    async function placeElement(el: BlackboardElementDto, row: number, col: number) {
    try {
      const updated = await updateGeometry(project.id, el.id, { row, col, width: el.width, height: el.height })
      setBoard((prev) =>
        prev ? { ...prev, elements: prev.elements.map((e) => (e.id === updated.id ? updated : e)) } : prev
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not place element there')
    }
  }
    async function handleShrinkToFit() {
    setShrinking(true)
    try {
      const updated = await shrinkToFit(project.id)
      setBoard(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to shrink the grid')
    } finally {
      setShrinking(false)
    }
  }

  async function handleUnstage(elementId: number) {
    try {
      const updated = await unstageElement(project.id, elementId)
      setBoard((prev) =>
        prev ? { ...prev, elements: prev.elements.map((e) => (e.id === updated.id ? updated : e)) } : prev
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to move element to the shelf')
    }
  }

  function handleGridDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleGridDrop(e: React.DragEvent) {
    e.preventDefault()
    const elementId = Number(e.dataTransfer.getData('text/plain'))
    if (!elementId || !gridRef.current || !board) return
    const el = board.elements.find((x) => x.id === elementId)
    if (!el) return

    const rect = gridRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - 8 // 8px = the grid container's p-2 padding
    const offsetY = e.clientY - rect.top - 8
    const col = board.minCol + Math.floor(offsetX / (CELL_SIZE + CELL_GAP))
    const row = board.minRow + Math.floor(offsetY / (CELL_SIZE + CELL_GAP))

    const clampedRow = clamp(row, board.minRow, board.maxRow - el.height + 1)
    const clampedCol = clamp(col, board.minCol, board.maxCol - el.width + 1)
    placeElement(el, clampedRow, clampedCol)
  }

  function handleShelfDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleShelfDrop(e: React.DragEvent) {
    e.preventDefault()
    const elementId = Number(e.dataTransfer.getData('text/plain'))
    if (!elementId) return
    handleUnstage(elementId)
  }

  async function handleCreateShelfElement() {
    if (pendingType !== 'IMAGE' && !pendingText.trim()) {
      toast.error('Add some text, or switch to an image element')
      return
    }
    setCreating(true)
    let created: BlackboardElementDto | null = null
    try {
      created = await addElement(project.id, {
        width: shelfWidth,
        height: shelfHeight,
        type: pendingType,
        textContent: pendingType === 'IMAGE' ? undefined : pendingText.trim(),
      })
      if (pendingFile && pendingType !== 'TEXT') {
        created = await uploadElementImage(project.id, created.id, pendingFile)
      }
      setBoard((prev) => (prev ? { ...prev, elements: [...prev.elements, created!] } : prev))
      setShelfFormOpen(false)
      setPendingText('')
      setPendingFile(null)
      setPendingType('TEXT')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add element')
      if (created) {
        deleteElement(project.id, created.id).catch(() => {})
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Loading blackboard...</div>
  }

  if (error || !board) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-destructive text-sm">{error || 'Could not load blackboard'}</p>
        <Button onClick={load} variant="outline" className="border-border bg-transparent text-foreground-secondary">
          Retry
        </Button>
      </div>
    )
  }

  const rows = board.maxRow - board.minRow + 1
  const cols = board.maxCol - board.minCol + 1

  return (
    <div className="flex flex-1 flex-col overflow-auto" data-testid="blackboard-view">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <p className="text-xs text-muted-foreground">
          Click two cells to place an element. Drag to move, drag the corner to resize.
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setResizePanelOpen((v) => !v)}
            className={`border-border bg-transparent text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground ${
              resizePanelOpen ? 'border-border-hover bg-accent' : ''
            }`}
          >
            <Maximize2 className="mr-2 h-4 w-4" />
            Resize grid
          </Button>
          {placingActive ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setPlacingActive(false)
                setPlaceAnchor(null)
                setHoverCell(null)
              }}
              className="text-muted-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel placement
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setPlacingActive(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="add-element-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add element
            </Button>
          )}
        </div>
         {resizePanelOpen && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/20 p-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleShrinkToFit}
            disabled={shrinking}
            className="border-border bg-transparent text-foreground-secondary hover:bg-accent hover:text-accent-foreground hover:text-foreground"
          >
            <Shrink className="mr-2 h-4 w-4" />
            {shrinking ? 'Fitting...' : 'Shrink to fit'}
          </Button>
          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground-subtle">
            Grow edge:
          </span>
          <EdgeButton icon={ArrowUp} label="Add row (top)" onClick={() => handleGrow('row', 'TOP')} />
          <EdgeButton icon={ArrowDown} label="Add row (bottom)" onClick={() => handleGrow('row', 'BOTTOM')} />
          <EdgeButton icon={ArrowLeft} label="Add column (left)" onClick={() => handleGrow('col', 'LEFT')} />
          <EdgeButton icon={ArrowRight} label="Add column (right)" onClick={() => handleGrow('col', 'RIGHT')} />
        </div>
      )}
      </div>

      <div className="flex flex-1 items-start justify-center gap-2 pb-8">
        <div className="flex flex-col items-center gap-2">

          <div className="flex items-center gap-2">

            <div
            ref={gridRef}
              className="relative grid rounded-xl border border-border bg-card/20 p-2"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
                gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
                gap: `${CELL_GAP}px`,
              }}
            onDragOver={handleGridDragOver}
            onDrop={handleGridDrop}
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
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onMouseEnter={() => placingActive && placeAnchor && setHoverCell({ row: rowIndex, col: colIndex })}
                      className={`rounded-md border border-dashed transition-colors ${placingActive ? 'cursor-crosshair' : ''
                        } ${inPreview
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
                <div
                  key={el.id}
                  onMouseDown={(e) => startMove(e, el)}
                  style={{
                    gridColumn: `${asPlaced(el).col - board.minCol + 1} / span ${el.width}`,
                    gridRow: `${asPlaced(el).row - board.minRow + 1} / span ${el.height}`,
                  }}
                  className={`group relative overflow-hidden rounded-xl border border-border bg-background shadow-sm ${canManage(el) ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                  data-testid={`blackboard-element-${el.id}`}
                >
                  {el.imageUrl && (
                    <img src={el.imageUrl} alt="" className="absolute inset-0 h-full w-full bg-zinc-900 object-contain" draggable={false} />
                  )}

                  {editingElementId === el.id ? (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="relative z-10 flex h-full flex-col gap-2 bg-background/95 p-2"
                    >
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        className="min-h-0 flex-1 w-full resize-none rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => saveEditText(el)} className="h-7 flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingElementId(null)} className="h-7 text-muted-foreground">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    el.textContent && (
                      <p
                        className={`relative z-10 line-clamp-[8] break-words p-2 text-xs text-foreground-secondary ${el.imageUrl ? 'mt-auto bg-background/80 backdrop-blur-sm' : ''
                          }`}
                      >
                        {el.textContent}
                      </p>
                    )
                  )}

                  {!el.imageUrl && el.type !== 'TEXT' && canManage(el) && (
                    <label className="relative z-10 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-muted-foreground-subtle">
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-[10px]">Upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(el, e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}

                  <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] text-muted-foreground-subtle backdrop-blur-sm">
                    {el.creatorName || 'Unknown'}
                  </span>

                  {canManage(el) && (
                    <div className="absolute right-1 top-1 z-10 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                                            <div
                        draggable
                        onMouseDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', String(el.id))}
                        className="cursor-grab rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground-secondary active:cursor-grabbing"
                        title="Drag to shelf"
                      >
                        <GripVertical className="h-3 w-3" />
                      </div>
                                            <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => handleUnstage(el.id)}
                        className="rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground-secondary"
                        title="Send to shelf"
                      >
                        <Layers className="h-3 w-3" />
                      </button>
                      {el.type !== 'IMAGE' && editingElementId !== el.id && (
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => startEditText(el)}
                          className="rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground-secondary"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => handleDeleteElement(el)}
                        className="rounded-full bg-background/90 p-1 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {canManage(el) && (
                    <div
                      onMouseDown={(e) => startResize(e, el)}
                      className="absolute bottom-0 right-0 z-10 h-3 w-3 cursor-se-resize opacity-0 transition group-hover:opacity-100"
                    >
                      <div className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-sm border-b-2 border-r-2 border-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
            <div
        onDragOver={handleShelfDragOver}
        onDrop={handleShelfDrop}
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
            onClick={() => setShelfFormOpen(true)}
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
            <div
              key={el.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(el.id))}
              style={{ width: el.width * CELL_SIZE + (el.width - 1) * CELL_GAP, height: el.height * CELL_SIZE }}
              className="group relative shrink-0 cursor-grab overflow-hidden rounded-xl border border-border bg-background shadow-sm active:cursor-grabbing"
              data-testid={`shelf-element-${el.id}`}
            >
              {el.imageUrl && (
                <img src={el.imageUrl} alt="" className="absolute inset-0 h-full w-full bg-zinc-900 object-contain" draggable={false} />
              )}
              {el.textContent && (
                <p className={`relative z-10 line-clamp-[8] break-words p-2 text-xs text-foreground-secondary ${el.imageUrl ? 'mt-auto bg-background/80 backdrop-blur-sm' : ''}`}>
                  {el.textContent}
                </p>
              )}
              <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] text-muted-foreground-subtle backdrop-blur-sm">
                {el.creatorName || 'Unknown'}
              </span>
              {canManage(el) && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => handleDeleteElement(el)}
                  className="absolute right-1 top-1 z-10 rounded-full bg-background/90 p-1 text-destructive opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {shelfFormOpen && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur-sm sm:absolute sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl sm:border">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            New shelf element
          </p>

          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Width (cells)</label>
              <Input
                type="number"
                min={1}
                value={shelfWidth}
                onChange={(e) => setShelfWidth(Math.max(1, Number(e.target.value) || 1))}
                className="border-border bg-zinc-900 text-foreground-secondary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Height (cells)</label>
              <Input
                type="number"
                min={1}
                value={shelfHeight}
                onChange={(e) => setShelfHeight(Math.max(1, Number(e.target.value) || 1))}
                className="border-border bg-zinc-900 text-foreground-secondary"
              />
            </div>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {(['TEXT', 'IMAGE', 'BOTH'] as ElementType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPendingType(t)}
                className={`rounded-md border py-1.5 text-xs font-medium transition ${
                  pendingType === t
                    ? 'border-primary bg-primary/10 text-foreground-secondary'
                    : 'border-border text-muted-foreground hover:border-border-hover'
                }`}
              >
                {t === 'TEXT' ? 'Text' : t === 'IMAGE' ? 'Image' : 'Both'}
              </button>
            ))}
          </div>

          {pendingType !== 'IMAGE' && (
            <textarea
              value={pendingText}
              onChange={(e) => setPendingText(e.target.value)}
              placeholder="Text content"
              className="mb-2 min-h-[70px] w-full rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary placeholder:text-muted-foreground-subtle focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          )}

          {pendingType !== 'TEXT' && (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              className="mb-2 border-border bg-zinc-900 text-xs text-foreground-secondary"
            />
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateShelfElement} disabled={creating} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              {creating ? 'Adding...' : 'Add to shelf'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShelfFormOpen(false)
                setPendingText('')
                setPendingFile(null)
                setPendingType('TEXT')
              }}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pendingRect && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur-sm sm:absolute sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl sm:border">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            New element ({pendingRect.width}×{pendingRect.height})
          </p>

          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {(['TEXT', 'IMAGE', 'BOTH'] as ElementType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPendingType(t)}
                className={`rounded-md border py-1.5 text-xs font-medium transition ${pendingType === t
                  ? 'border-primary bg-primary/10 text-foreground-secondary'
                  : 'border-border text-muted-foreground hover:border-border-hover'
                  }`}
              >
                {t === 'TEXT' ? 'Text' : t === 'IMAGE' ? 'Image' : 'Both'}
              </button>
            ))}
          </div>

          {pendingType !== 'IMAGE' && (
            <textarea
              value={pendingText}
              onChange={(e) => setPendingText(e.target.value)}
              placeholder="Text content"
              className="mb-2 min-h-[70px] w-full rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary placeholder:text-muted-foreground-subtle focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          )}

          {pendingType !== 'TEXT' && (
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              className="mb-2 border-border bg-zinc-900 text-xs text-foreground-secondary"
            />
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateElement} disabled={creating} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              {creating ? 'Adding...' : 'Add to board'}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelPlacement} className="text-muted-foreground">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function EdgeButton({
  icon: Icon,
  label,
  onClick,
  vertical,
}: {
  icon: typeof ArrowUp
  label: string
  onClick: () => void
  vertical?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground-subtle hover:border-border-hover hover:text-foreground-secondary ${vertical ? 'h-9 w-9' : 'h-9 w-9'
        }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}