import { Button } from '@components/shared/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorModalProps {
  errorMessage: string | null
  errorBoxRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}

export function ErrorModal({ errorMessage, errorBoxRef, onClose }: ErrorModalProps) {
  if (!errorMessage) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        ref={errorBoxRef}
        className="w-full max-w-sm rounded-xl border border-red-500/50 bg-zinc-950 p-5 shadow-2xl shadow-black/80 ring-1 ring-red-500/30 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-950/80 p-2 text-red-400 shrink-0 border border-red-800/60">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground tracking-wide">
              NO SE PUEDE EDITAR:
            </p>
            <p className="mt-1 text-xs text-red-300 break-words leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="bg-red-600/90 text-white hover:bg-red-600 px-4 py-1 text-xs font-semibold rounded-md transition"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  )
}