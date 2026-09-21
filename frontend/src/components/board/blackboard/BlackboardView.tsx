import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProjectSummary, Member } from '@app-types/workgroup'
import type {
  AttachmentType,
  BlackboardDto,
  BlackboardElementDto,
  GridEdge,
  PlacedBlackboardElement,
  PlacementRect,
} from '@app-types/blackboard'
import {
  getBlackboard,
  addElement,
  updateGeometry,
  updateContent,
  updateElementLink,
  uploadElementImage,
  uploadElementPdf,
  deleteElement,
  addRow,
  addColumn,
  unstageElement,
  shrinkToFit,
} from '@api/board/blackboardAPI'
import { Button } from '@components/shared/ui/button'
import { toast } from 'sonner'
import { BlackboardToolbar } from './BlackboardToolbar'
import { BlackboardResizePanel } from './BlackboardResizePanel'
import { BlackboardGrid } from './BlackboardGrid'
import { BlackboardShelf } from './BlackboardShelf'
import { BlackboardElementForm } from './BlackboardElementForm'
import type { ElementHandlers } from './BlackboardElementCard'

const CELL_SIZE = 96
const CELL_GAP = 8
const ZOOM_MIN = 0.25
const ZOOM_MAX = 2
const ZOOM_STEP = 0.15

interface Props {
  project: ProjectSummary
  currentUser: Member
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function BlackboardView({ project, currentUser }: Props) {
  const [board, setBoard] = useState<BlackboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Placement (grid) flow
  const [placingActive, setPlacingActive] = useState(false)
  const [placeAnchor, setPlaceAnchor] = useState<{ row: number; col: number } | null>(null)
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)
  const [pendingRect, setPendingRect] = useState<PlacementRect | null>(null)
  const [pendingAttachmentType, setPendingAttachmentType] = useState<AttachmentType>('NONE')
  const [pendingText, setPendingText] = useState('')
  const [pendingLinkUrl, setPendingLinkUrl] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

  // Shelf creation flow — independent draft state from the grid-placement
  // flow above, so the two forms can never cross-contaminate each other.
  const [shelfFormOpen, setShelfFormOpen] = useState(false)
  const [shelfWidth, setShelfWidth] = useState(2)
  const [shelfHeight, setShelfHeight] = useState(2)
  const [shelfAttachmentType, setShelfAttachmentType] = useState<AttachmentType>('NONE')
  const [shelfText, setShelfText] = useState('')
  const [shelfLinkUrl, setShelfLinkUrl] = useState('')
  const [shelfFile, setShelfFile] = useState<File | null>(null)
  const [shelfCreating, setShelfCreating] = useState(false)

  const [resizePanelOpen, setResizePanelOpen] = useState(false)
  const [shrinking, setShrinking] = useState(false)

  const [zoom, setZoom] = useState(1)
  const gridRef = useRef<HTMLDivElement>(null!)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  const placedElements: PlacedBlackboardElement[] =
    board?.elements.filter((e): e is PlacedBlackboardElement => e.row !== null && e.col !== null) ?? []
  const shelvedElements = board?.elements.filter((e) => e.row === null || e.col === null) ?? []

  const previewRect = useMemo<PlacementRect | null>(() => {
    if (!placingActive || !placeAnchor || !hoverCell) return null
    return {
      row: Math.min(placeAnchor.row, hoverCell.row),
      col: Math.min(placeAnchor.col, hoverCell.col),
      width: Math.abs(placeAnchor.col - hoverCell.col) + 1,
      height: Math.abs(placeAnchor.row - hoverCell.row) + 1,
    }
  }, [placingActive, placeAnchor, hoverCell])

  function canManage(el: BlackboardElementDto) {
    return project.isLeader || el.creatorId === currentUser.id
  }

  function updateElementInState(updated: BlackboardElementDto) {
    setBoard((prev) =>
      prev ? { ...prev, elements: prev.elements.map((e) => (e.id === updated.id ? updated : e)) } : prev
    )
  }

  // ---- placement (grid) flow ----

  function handleCellClick(row: number, col: number) {
    if (!placingActive) return
    if (!placeAnchor) {
      setPlaceAnchor({ row, col })
      return
    }
    setPendingRect({
      row: Math.min(placeAnchor.row, row),
      col: Math.min(placeAnchor.col, col),
      width: Math.abs(placeAnchor.col - col) + 1,
      height: Math.abs(placeAnchor.row - row) + 1,
    })
    setPlaceAnchor(null)
    setHoverCell(null)
    setPlacingActive(false)
  }

  function cancelPlacement() {
    setPlacingActive(false)
    setPlaceAnchor(null)
    setHoverCell(null)
    setPendingRect(null)
    setPendingAttachmentType('NONE')
    setPendingText('')
    setPendingLinkUrl('')
    setPendingFile(null)
  }

  async function handleCreateElement() {
    if (!pendingRect) return
    if (pendingAttachmentType === 'NONE' && !pendingText.trim()) {
      toast.error('Add some text, or choose an image, PDF, or link')
      return
    }
    if (pendingAttachmentType === 'LINK' && !pendingLinkUrl.trim()) {
      toast.error('Enter a URL for the link')
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
        attachmentType: pendingAttachmentType,
        textContent: pendingText.trim() || undefined,
        linkUrl: pendingAttachmentType === 'LINK' ? pendingLinkUrl.trim() : undefined,
      })

      if (pendingFile && pendingAttachmentType === 'IMAGE') {
        created = await uploadElementImage(project.id, created.id, pendingFile)
      } else if (pendingFile && pendingAttachmentType === 'PDF') {
        created = await uploadElementPdf(project.id, created.id, pendingFile)
      }

      setBoard((prev) => (prev ? { ...prev, elements: [...prev.elements, created!] } : prev))
      cancelPlacement()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add element')
      if (created) {
        deleteElement(project.id, created.id).catch(() => {})
      }
    } finally {
      setCreating(false)
    }
  }

  // ---- shelf creation flow ----

  function cancelShelfForm() {
    setShelfFormOpen(false)
    setShelfAttachmentType('NONE')
    setShelfText('')
    setShelfLinkUrl('')
    setShelfFile(null)
  }

  async function handleCreateShelfElement() {
    if (shelfAttachmentType === 'NONE' && !shelfText.trim()) {
      toast.error('Add some text, or choose an image, PDF, or link')
      return
    }
    if (shelfAttachmentType === 'LINK' && !shelfLinkUrl.trim()) {
      toast.error('Enter a URL for the link')
      return
    }
    setShelfCreating(true)
    let created: BlackboardElementDto | null = null
    try {
      created = await addElement(project.id, {
        width: shelfWidth,
        height: shelfHeight,
        attachmentType: shelfAttachmentType,
        textContent: shelfText.trim() || undefined,
        linkUrl: shelfAttachmentType === 'LINK' ? shelfLinkUrl.trim() : undefined,
      })
      if (shelfFile && shelfAttachmentType === 'IMAGE') {
        created = await uploadElementImage(project.id, created.id, shelfFile)
      } else if (shelfFile && shelfAttachmentType === 'PDF') {
        created = await uploadElementPdf(project.id, created.id, shelfFile)
      }
      setBoard((prev) => (prev ? { ...prev, elements: [...prev.elements, created!] } : prev))
      cancelShelfForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add element')
      if (created) {
        deleteElement(project.id, created.id).catch(() => {})
      }
    } finally {
      setShelfCreating(false)
    }
  }

  // ---- shared element actions (used by both grid + shelf cards) ----

  async function handleDeleteElement(el: BlackboardElementDto) {
    try {
      await deleteElement(project.id, el.id)
      setBoard((prev) => (prev ? { ...prev, elements: prev.elements.filter((e) => e.id !== el.id) } : prev))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete element')
    }
  }

  async function handleSaveText(el: BlackboardElementDto, text: string): Promise<boolean> {
    try {
      updateElementInState(await updateContent(project.id, el.id, { textContent: text }))
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update text')
      return false
    }
  }

  async function handleSaveLink(el: BlackboardElementDto, url: string): Promise<boolean> {
    try {
      updateElementInState(await updateElementLink(project.id, el.id, url))
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update link')
      return false
    }
  }

  async function handleUploadImage(el: BlackboardElementDto, file: File) {
    try {
      updateElementInState(await uploadElementImage(project.id, el.id, file))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload image')
    }
  }

  async function handleUploadPdf(el: BlackboardElementDto, file: File) {
    try {
      updateElementInState(await uploadElementPdf(project.id, el.id, file))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload PDF')
    }
  }

  function handleElementDragStart(e: React.DragEvent, elementId: number) {
    e.dataTransfer.setData('text/plain', String(elementId))
  }

  const elementHandlers: ElementHandlers = {
    onDelete: handleDeleteElement,
    onSaveText: handleSaveText,
    onSaveLink: handleSaveLink,
    onUploadImage: handleUploadImage,
    onUploadPdf: handleUploadPdf,
    onDragStart: handleElementDragStart,
  }

  // ---- move / resize ----

  function startMove(e: React.MouseEvent, el: PlacedBlackboardElement) {
    if (!canManage(el)) return
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startRow = el.row
    const startCol = el.col
    let currentRow = startRow
    let currentCol = startCol

    function onMove(ev: MouseEvent) {
      if (!board) return
      const deltaCol = Math.round((ev.clientX - startX) / ((CELL_SIZE + CELL_GAP) * zoom))
      const deltaRow = Math.round((ev.clientY - startY) / ((CELL_SIZE + CELL_GAP) * zoom))
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
        .then(updateElementInState)
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to move element')
          updateElementInState(el)
        })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startResize(e: React.MouseEvent, el: PlacedBlackboardElement) {
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
      const deltaCol = Math.round((ev.clientX - startX) / ((CELL_SIZE + CELL_GAP) * zoom))
      const deltaRow = Math.round((ev.clientY - startY) / ((CELL_SIZE + CELL_GAP) * zoom))
      const newWidth = clamp(startWidth + deltaCol, 1, board.maxCol - el.col + 1)
      const newHeight = clamp(startHeight + deltaRow, 1, board.maxRow - el.row + 1)
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
      updateGeometry(project.id, el.id, { row: el.row, col: el.col, width: currentWidth, height: currentHeight })
        .then(updateElementInState)
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to resize element')
          updateElementInState(el)
        })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ---- grid growth / shrink ----

  async function handleGrow(kind: 'row' | 'col', edge: GridEdge) {
    try {
      const updated = kind === 'row' ? await addRow(project.id, edge) : await addColumn(project.id, edge)
      setBoard(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resize the board')
    }
  }

  async function handleShrinkToFit() {
    setShrinking(true)
    try {
      setBoard(await shrinkToFit(project.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to shrink the grid')
    } finally {
      setShrinking(false)
    }
  }

  // ---- shelf <-> grid movement ----

  async function placeElement(el: BlackboardElementDto, row: number, col: number) {
    try {
      updateElementInState(
        await updateGeometry(project.id, el.id, { row, col, width: el.width, height: el.height })
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not place element there')
    }
  }

  async function handleUnstage(elementId: number) {
    try {
      updateElementInState(await unstageElement(project.id, elementId))
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
    const offsetX = (e.clientX - rect.left - 8 * zoom) / zoom
    const offsetY = (e.clientY - rect.top - 8 * zoom) / zoom
    const col = board.minCol + Math.floor(offsetX / (CELL_SIZE + CELL_GAP))
    const row = board.minRow + Math.floor(offsetY / (CELL_SIZE + CELL_GAP))

    placeElement(
      el,
      clamp(row, board.minRow, board.maxRow - el.height + 1),
      clamp(col, board.minCol, board.maxCol - el.width + 1)
    )
  }

  function handleShelfDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleShelfDrop(e: React.DragEvent) {
    e.preventDefault()
    const elementId = Number(e.dataTransfer.getData('text/plain'))
    if (elementId) handleUnstage(elementId)
  }

  // ---- zoom ----

  function zoomIn() {
    setZoom((z) => Math.min(ZOOM_MAX, Number((z + ZOOM_STEP).toFixed(2))))
  }

  function zoomOut() {
    setZoom((z) => Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2))))
  }

  function autoZoom() {
    if (!board || !scrollContainerRef.current) return
    const container = scrollContainerRef.current.getBoundingClientRect()
    const c = board.maxCol - board.minCol + 1
    const r = board.maxRow - board.minRow + 1
    const gridWidth = c * CELL_SIZE + (c - 1) * CELL_GAP + 16
    const gridHeight = r * CELL_SIZE + (r - 1) * CELL_GAP + 16
    const fitScale = Math.min((container.width - 32) / gridWidth, (container.height - 32) / gridHeight)
    setZoom(Number(clamp(fitScale, ZOOM_MIN, ZOOM_MAX).toFixed(2)))
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

  return (
    <div className="flex flex-1 flex-col overflow-auto" data-testid="blackboard-view">
      <BlackboardToolbar
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onAutoZoom={autoZoom}
        resizePanelOpen={resizePanelOpen}
        onToggleResizePanel={() => setResizePanelOpen((v) => !v)}
        placingActive={placingActive}
        onStartPlacing={() => setPlacingActive(true)}
        onCancelPlacing={() => {
          setPlacingActive(false)
          setPlaceAnchor(null)
          setHoverCell(null)
        }}
      />

      {resizePanelOpen && (
        <BlackboardResizePanel
          shrinking={shrinking}
          onShrinkToFit={handleShrinkToFit}
          onGrow={handleGrow}
          onClose={() => setResizePanelOpen(false)}
        />
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-auto pb-8">
        <div className="w-fit mx-auto p-8">
          <BlackboardGrid
            board={board}
            placedElements={placedElements}
            projectId={project.id}
            canManage={canManage}
            zoom={zoom}
            gridRef={gridRef}
            placingActive={placingActive}
            placeAnchor={placeAnchor}
            previewRect={previewRect}
            onCellClick={handleCellClick}
            onCellHover={(row, col) => setHoverCell({ row, col })}
            onDragOver={handleGridDragOver}
            onDrop={handleGridDrop}
            onStartMove={startMove}
            onStartResize={startResize}
            onSendToShelf={handleUnstage}
            handlers={elementHandlers}
          />
        </div>
      </div>

      <BlackboardShelf
        shelvedElements={shelvedElements}
        projectId={project.id}
        canManage={canManage}
        handlers={elementHandlers}
        onDragOver={handleShelfDragOver}
        onDrop={handleShelfDrop}
        onAddClick={() => setShelfFormOpen(true)}
      />

      {shelfFormOpen && (
        <BlackboardElementForm
          titleText="New shelf element"
          attachmentType={shelfAttachmentType}
          onAttachmentTypeChange={setShelfAttachmentType}
          textContent={shelfText}
          onTextContentChange={setShelfText}
          linkUrl={shelfLinkUrl}
          onLinkUrlChange={setShelfLinkUrl}
          onFileChange={setShelfFile}
          sizeFields={{
            width: shelfWidth,
            height: shelfHeight,
            onWidthChange: setShelfWidth,
            onHeightChange: setShelfHeight,
          }}
          submitting={shelfCreating}
          submitLabel="Add to shelf"
          onSubmit={handleCreateShelfElement}
          onCancel={cancelShelfForm}
        />
      )}

      {pendingRect && (
        <BlackboardElementForm
          titleText={`New element (${pendingRect.width}×${pendingRect.height})`}
          attachmentType={pendingAttachmentType}
          onAttachmentTypeChange={setPendingAttachmentType}
          textContent={pendingText}
          onTextContentChange={setPendingText}
          linkUrl={pendingLinkUrl}
          onLinkUrlChange={setPendingLinkUrl}
          onFileChange={setPendingFile}
          submitting={creating}
          submitLabel="Add to board"
          onSubmit={handleCreateElement}
          onCancel={cancelPlacement}
        />
      )}
    </div>
  )
}