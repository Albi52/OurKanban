import { useState, useRef, useEffect } from 'react'
import { ListFilter, Settings } from 'lucide-react'
import { Button } from '@components/shared/ui/button'

export function ProjectActionsHeader() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth)
    }
  }, [filterOpen, settingsOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        setFilterOpen(false)
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <div className="flex items-center gap-1.5 bg-card/40 border border-border px-2 py-1.5 rounded-xl">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setFilterOpen((prev) => !prev)
            setSettingsOpen(false)
          }}
          className="h-8 w-8 p-0 text-muted-foreground hover:bg-zinc-800 hover:text-foreground flex items-center justify-center"
          title="Filtros y ordenación"
        >
          <ListFilter className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setSettingsOpen((prev) => !prev)
            setFilterOpen(false)
          }}
          className="h-8 w-8 p-0 text-muted-foreground hover:bg-zinc-800 hover:text-foreground flex items-center justify-center"
          title="Ajustes del proyecto"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {filterOpen && (
        <div
          style={{ width: `${containerWidth > 0 ? containerWidth : '100%'}px` }}
          className="absolute right-0 mt-2 rounded-xl border border-border bg-zinc-950 p-2 shadow-2xl z-50 text-xs min-w-[180px]"
        >
          <div className="px-2 py-1.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] border-b border-border/60 mb-1">
            Opciones de Filtro
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            className="w-full text-left px-2 py-1.5 rounded text-foreground-secondary hover:bg-zinc-800 hover:text-foreground transition"
          >
            Mostrar solo mis tareas
          </button>
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            className="w-full text-left px-2 py-1.5 rounded text-foreground-secondary hover:bg-zinc-800 hover:text-foreground transition"
          >
            Ordenar por prioridad
          </button>
        </div>
      )}

      {settingsOpen && (
        <div
          style={{ width: `${containerWidth > 0 ? containerWidth : '100%'}px` }}
          className="absolute right-0 mt-2 rounded-xl border border-border bg-zinc-950 p-2 shadow-2xl z-50 text-xs min-w-[180px]"
        >
          <div className="px-2 py-1.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] border-b border-border/60 mb-1">
            Ajustes
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="w-full text-left px-2 py-1.5 rounded text-foreground-secondary hover:bg-zinc-800 hover:text-foreground transition"
          >
            Configuración del tablero
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="w-full text-left px-2 py-1.5 rounded text-destructive hover:bg-red-950/30 hover:text-red-300 transition"
          >
            Gestionar miembros
          </button>
        </div>
      )}
    </div>
  )
}