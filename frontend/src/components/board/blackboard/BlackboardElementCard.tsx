import { useState } from 'react'
import type { BlackboardElementDto } from '@app-types/blackboard'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { LinkPreviewCard } from './LinkPreviewCard'
import { Trash2, Pencil, Image as ImageIcon, FileText, Link2, GripVertical, Layers } from 'lucide-react'

export interface ElementHandlers {
  onDelete: (el: BlackboardElementDto) => void
  onSaveText: (el: BlackboardElementDto, text: string) => Promise<boolean>
  onSaveLink: (el: BlackboardElementDto, url: string) => Promise<boolean>
  onUploadImage: (el: BlackboardElementDto, file: File) => void
  onUploadPdf: (el: BlackboardElementDto, file: File) => void
  onDragStart: (e: React.DragEvent, elementId: number) => void
}

interface Props {
  element: BlackboardElementDto
  projectId: number
  canManage: boolean
  variant: 'grid' | 'shelf'
  style?: React.CSSProperties
  handlers: ElementHandlers
  onMouseDownMove?: (e: React.MouseEvent) => void
  onMouseDownResize?: (e: React.MouseEvent) => void
  onSendToShelf?: () => void
}

export function BlackboardElementCard({
  element,
  projectId,
  canManage,
  variant,
  style,
  handlers,
  onMouseDownMove,
  onMouseDownResize,
  onSendToShelf,
}: Props) {
  const [isEditingText, setIsEditingText] = useState(false)
  const [textDraft, setTextDraft] = useState(element.textContent ?? '')
  const [savingText, setSavingText] = useState(false)

  const [isEditingLink, setIsEditingLink] = useState(false)
  const [linkDraft, setLinkDraft] = useState(element.linkUrl ?? '')
  const [savingLink, setSavingLink] = useState(false)

  const hasVisualAttachment = element.attachmentType !== 'NONE'

  function startEditText() {
    setTextDraft(element.textContent ?? '')
    setIsEditingText(true)
  }

  async function submitText() {
    setSavingText(true)
    const ok = await handlers.onSaveText(element, textDraft.trim())
    setSavingText(false)
    if (ok) setIsEditingText(false)
  }

  function startEditLink() {
    setLinkDraft(element.linkUrl ?? '')
    setIsEditingLink(true)
  }

  async function submitLink() {
    if (!linkDraft.trim()) return
    setSavingLink(true)
    const ok = await handlers.onSaveLink(element, linkDraft.trim())
    setSavingLink(false)
    if (ok) setIsEditingLink(false)
  }

  function renderAttachment() {
    if (element.attachmentType === 'IMAGE') {
      if (element.imageUrl) {
        return (
          <img
            src={element.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full bg-zinc-900 object-contain"
            draggable={false}
          />
        )
      }
      if (canManage) {
        return (
          <label className="relative z-10 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-muted-foreground-subtle">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[10px]">Upload image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handlers.onUploadImage(element, f)
              }}
            />
          </label>
        )
      }
      return null
    }

    if (element.attachmentType === 'PDF') {
      if (element.pdfUrl) {
        return (
          <button
            type="button"
            onClick={() => window.open(element.pdfUrl!, '_blank', 'noopener,noreferrer')}
            title={element.pdfFileName ?? 'Open PDF'}
            className="absolute inset-0 flex items-center justify-center bg-zinc-900"
          >
            {element.pdfThumbnailUrl ? (
              <img
                src={element.pdfThumbnailUrl}
                alt=""
                className="h-full w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 px-2 text-muted-foreground-subtle">
                <FileText className="h-8 w-8" />
                <span className="max-w-full truncate text-[10px]">
                  {element.pdfFileName || 'PDF document'}
                </span>
              </div>
            )}
          </button>
        )
      }
      if (canManage) {
        return (
          <label className="relative z-10 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-muted-foreground-subtle">
            <FileText className="h-5 w-5" />
            <span className="text-[10px]">Upload PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handlers.onUploadPdf(element, f)
              }}
            />
          </label>
        )
      }
      return null
    }

    if (element.attachmentType === 'LINK') {
      if (isEditingLink) {
        return (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="relative z-10 flex h-full flex-col gap-2 bg-background/95 p-2"
          >
            <Input
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              placeholder="https://..."
              autoFocus
              className="border-border bg-zinc-900 text-xs text-foreground-secondary"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={submitLink}
                disabled={savingLink}
                className="h-7 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingLink(false)}
                className="h-7 text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        )
      }
      if (element.linkUrl) {
        return (
          <div className="absolute inset-0">
            <LinkPreviewCard projectId={projectId} url={element.linkUrl} />
          </div>
        )
      }
      if (canManage) {
        return (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={startEditLink}
            className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground-subtle"
          >
            <Link2 className="h-5 w-5" />
            <span className="text-[10px]">Add link</span>
          </button>
        )
      }
      return null
    }

    return null
  }

  return (
    <div
      onMouseDown={variant === 'grid' ? onMouseDownMove : undefined}
      draggable={variant === 'shelf'}
      onDragStart={variant === 'shelf' ? (e) => handlers.onDragStart(e, element.id) : undefined}
      style={style}
      className={`group relative overflow-hidden rounded-xl border border-border bg-background shadow-sm ${
        variant === 'shelf' ? 'shrink-0 cursor-grab active:cursor-grabbing' : ''
      } ${variant === 'grid' && canManage ? 'cursor-grab active:cursor-grabbing' : ''}`}
      data-testid={`blackboard-element-${element.id}`}
    >
      {renderAttachment()}

      {isEditingText ? (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="relative z-10 flex h-full flex-col gap-2 bg-background/95 p-2"
        >
          <textarea
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            autoFocus
            className="min-h-0 flex-1 w-full resize-none rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={submitText}
              disabled={savingText}
              className="h-7 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingText(false)}
              className="h-7 text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        element.textContent && (
          <p
            className={`line-clamp-[8] break-words p-2 text-xs text-foreground-secondary ${
              hasVisualAttachment
                ? 'absolute inset-x-0 bottom-0 z-10 bg-background/80 backdrop-blur-sm'
                : 'relative z-10 h-full'
            }`}
          >
            {element.textContent}
          </p>
        )
      )}

      <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] text-muted-foreground-subtle backdrop-blur-sm">
        {element.creatorName || 'Unknown'}
      </span>

      {canManage && (
        <div className="absolute right-1 top-1 z-10 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
          {variant === 'grid' && (
            <div
              draggable
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => handlers.onDragStart(e, element.id)}
              className="cursor-grab rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground-secondary active:cursor-grabbing"
              title="Drag to shelf"
            >
              <GripVertical className="h-3 w-3" />
            </div>
          )}
          {variant === 'grid' && onSendToShelf && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onSendToShelf}
              className="rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground-secondary"
              title="Send to shelf"
            >
              <Layers className="h-3 w-3" />
            </button>
          )}
          {!isEditingText && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={startEditText}
              className="rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground-secondary"
              title="Edit text"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {element.attachmentType === 'LINK' && element.linkUrl && !isEditingLink && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={startEditLink}
              className="rounded-full bg-background/90 p-1 text-muted-foreground hover:text-foreground-secondary"
              title="Edit link"
            >
              <Link2 className="h-3 w-3" />
            </button>
          )}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => handlers.onDelete(element)}
            className="rounded-full bg-background/90 p-1 text-destructive hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {variant === 'grid' && canManage && onMouseDownResize && (
        <div
          onMouseDown={onMouseDownResize}
          className="absolute bottom-0 right-0 z-10 h-3 w-3 cursor-se-resize opacity-0 transition group-hover:opacity-100"
        >
          <div className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-sm border-b-2 border-r-2 border-muted-foreground" />
        </div>
      )}
    </div>
  )
}