import type { AttachmentType } from '@app-types/blackboard'
import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'

interface SizeFields {
  width: number
  height: number
  onWidthChange: (v: number) => void
  onHeightChange: (v: number) => void
}

interface Props {
  titleText: string
  attachmentType: AttachmentType
  onAttachmentTypeChange: (t: AttachmentType) => void
  textContent: string
  onTextContentChange: (v: string) => void
  linkUrl: string
  onLinkUrlChange: (v: string) => void
  onFileChange: (f: File | null) => void
  sizeFields?: SizeFields
  submitting: boolean
  submitLabel: string
  onSubmit: () => void
  onCancel: () => void
}

const TYPE_LABELS: Record<AttachmentType, string> = {
  NONE: 'None',
  IMAGE: 'Image',
  PDF: 'PDF',
  LINK: 'Link',
}

export function BlackboardElementForm({
  titleText,
  attachmentType,
  onAttachmentTypeChange,
  textContent,
  onTextContentChange,
  linkUrl,
  onLinkUrlChange,
  onFileChange,
  sizeFields,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur-sm sm:absolute sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl sm:border">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{titleText}</p>

      {sizeFields && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">Width (cells)</label>
            <Input
              type="number"
              min={1}
              value={sizeFields.width}
              onChange={(e) => sizeFields.onWidthChange(Math.max(1, Number(e.target.value) || 1))}
              className="border-border bg-zinc-900 text-foreground-secondary"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">Height (cells)</label>
            <Input
              type="number"
              min={1}
              value={sizeFields.height}
              onChange={(e) => sizeFields.onHeightChange(Math.max(1, Number(e.target.value) || 1))}
              className="border-border bg-zinc-900 text-foreground-secondary"
            />
          </div>
        </div>
      )}

      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {(['NONE', 'IMAGE', 'PDF', 'LINK'] as AttachmentType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onAttachmentTypeChange(t)}
            className={`rounded-md border py-1.5 text-xs font-medium transition ${
              attachmentType === t
                ? 'border-primary bg-primary/10 text-foreground-secondary'
                : 'border-border text-muted-foreground hover:border-border-hover'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <textarea
        value={textContent}
        onChange={(e) => onTextContentChange(e.target.value)}
        placeholder={attachmentType === 'NONE' ? 'Text content' : 'Text (optional)'}
        className="mb-2 min-h-[70px] w-full rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary placeholder:text-muted-foreground-subtle focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />

      {attachmentType === 'IMAGE' && (
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="mb-2 border-border bg-zinc-900 text-xs text-foreground-secondary"
        />
      )}

      {attachmentType === 'PDF' && (
        <Input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="mb-2 border-border bg-zinc-900 text-xs text-foreground-secondary"
        />
      )}

      {attachmentType === 'LINK' && (
        <Input
          value={linkUrl}
          onChange={(e) => onLinkUrlChange(e.target.value)}
          placeholder="https://..."
          className="mb-2 border-border bg-zinc-900 text-xs text-foreground-secondary placeholder:text-muted-foreground-subtle"
        />
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting ? 'Adding...' : submitLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="text-muted-foreground">
          Cancel
        </Button>
      </div>
    </div>
  )
}