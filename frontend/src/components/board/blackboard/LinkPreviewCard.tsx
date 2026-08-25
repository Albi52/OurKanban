import { useEffect, useState } from 'react'
import { getLinkPreview } from '@api/board/blackboardAPI'
import type { LinkPreviewDto } from '@app-types/blackboard'
import { Link2 } from 'lucide-react'

interface Props {
  projectId: number
  url: string
}

export function LinkPreviewCard({ projectId, url }: Props) {
  const [preview, setPreview] = useState<LinkPreviewDto | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPreview(null)
    setFailed(false)
    getLinkPreview(projectId, url)
      .then((data) => {
        if (!cancelled) setPreview(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, url])

  function open() {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  let hostname = url
  try {
    hostname = new URL(url).hostname
  } catch {
    // leave hostname as the raw url if it doesn't parse
  }

  if (failed) {
    return (
      <button
        onClick={open}
        className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-muted-foreground-subtle hover:text-muted-foreground"
      >
        <Link2 className="h-5 w-5" />
        <span className="line-clamp-2 text-[10px] break-all">{url}</span>
      </button>
    )
  }

  if (!preview) {
    return (
      <div className="flex h-full w-full animate-pulse flex-col gap-1.5 p-2">
        <div className="h-2/3 rounded bg-muted" />
        <div className="h-2 w-3/4 rounded bg-muted" />
        <div className="h-2 w-1/2 rounded bg-muted" />
      </div>
    )
  }

  return (
    <button onClick={open} className="flex h-full w-full flex-col overflow-hidden text-left">
      {preview.imageUrl && (
        <div className="min-h-0 flex-1 overflow-hidden bg-zinc-900">
          <img src={preview.imageUrl} alt="" className="h-full w-full object-cover" draggable={false} />
        </div>
      )}
      <div className="shrink-0 space-y-0.5 border-t border-border/60 bg-background/95 p-2">
        <p className="line-clamp-2 text-xs font-medium text-foreground-secondary">
          {preview.title || hostname}
        </p>
        {preview.description && (
          <p className="line-clamp-1 text-[10px] text-muted-foreground">{preview.description}</p>
        )}
        <p className="truncate text-[9px] uppercase tracking-wide text-muted-foreground-subtle">
          {preview.siteName || hostname}
        </p>
      </div>
    </button>
  )
}