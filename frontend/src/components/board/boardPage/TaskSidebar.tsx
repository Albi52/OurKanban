import { Button } from '@components/shared/ui/button'
import { Input } from '@components/shared/ui/input'
import { Pencil, Trash2, X } from 'lucide-react'
import type { Task, Priority } from '@components/board/KanbanView'
import type { CalendarEvent } from '@components/board/CalendarView'
import type { Member } from '@app-types/workgroup'
import type { ProjectMember } from '@/types/projectMember'

interface TaskSidebarProps {
  selectedTask: Task | null
  selectedEvent: CalendarEvent | null
  eventDraftDate: string | null
  eventDraftTitle: string
  setEventDraftTitle: (v: string) => void
  setEventDraftDate: (v: string | null) => void
  handleCreateEvent: () => void
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  canModifySelected: boolean
  editTitle: string
  setEditTitle: (v: string) => void
  editDesc: string
  setEditDesc: (v: string) => void
  editPriority: string
  setEditPriority: (v: string) => void
  editAssigneeId: number | undefined
  setEditAssigneeId: (v: number | undefined) => void
  groupMembers: Member[]
  currentUser: ProjectMember
  editStart: string
  setEditStart: (v: string) => void
  editEnd: string
  setEditEnd: (v: string) => void
  handleSaveEdit: () => void
  handleDeleteTask: (id: string) => void
  handleDeleteEvent: (id: string) => void
  closeSidebar: () => void
}

export function TaskSidebar({
  selectedTask,
  selectedEvent,
  eventDraftDate,
  eventDraftTitle,
  setEventDraftTitle,
  setEventDraftDate,
  handleCreateEvent,
  isEditing,
  setIsEditing,
  canModifySelected,
  editTitle,
  setEditTitle,
  editDesc,
  setEditDesc,
  editPriority,
  setEditPriority,
  editAssigneeId,
  setEditAssigneeId,
  groupMembers,
  currentUser,
  editStart,
  setEditStart,
  editEnd,
  setEditEnd,
  handleSaveEdit,
  handleDeleteTask,
  handleDeleteEvent,
  closeSidebar,
}: TaskSidebarProps) {
  if (eventDraftDate && !selectedTask && !selectedEvent) {
    return (
      <div data-task-sidebar="true" className="w-80 shrink-0 h-full rounded-xl border border-purple-500/50 bg-background p-5 flex flex-col justify-between overflow-y-auto z-10">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">New Event</span>
            <button onClick={() => setEventDraftDate(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={eventDraftTitle}
                onChange={(e) => setEventDraftTitle(e.target.value)}
                autoFocus
                placeholder="Event title"
                className="mt-1 border-border bg-zinc-900 text-foreground-secondary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" value={eventDraftDate} onChange={(e) => setEventDraftDate(e.target.value)} className="mt-1 border-border bg-zinc-900 text-foreground-secondary" />
            </div>
          </div>
        </div>
        <Button onClick={handleCreateEvent} disabled={!eventDraftTitle.trim()} className="w-full bg-purple-700 text-white hover:bg-purple-600">
          Create event
        </Button>
      </div>
    )
  }

  if (!selectedTask && !selectedEvent) return null

  return (
    <div data-task-sidebar="true" className="w-80 shrink-0 h-full rounded-xl border border-border bg-background p-5 flex flex-col justify-between overflow-y-auto z-10">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {selectedEvent ? 'Event Info' : 'Task Info'}
          </span>
          <div className="flex items-center gap-1">
            {canModifySelected && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground" title="Edit Item">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={closeSidebar} className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-medium text-muted-foreground">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 border-border bg-zinc-900 text-foreground-secondary" />
            </div>
            {selectedTask && (
              <div>
                <label className="font-medium text-muted-foreground">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="mt-1 min-h-[90px] w-full rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary focus:outline-none focus:ring-1 focus:ring-zinc-500" />
              </div>
            )}

            {selectedTask && (
              <div>
                <label className="font-medium text-muted-foreground block mb-1">Priority</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditPriority('low')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition ${
                      editPriority === 'low'
                        ? 'bg-emerald-950 border-emerald-500 text-success'
                        : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-800'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPriority('medium')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition ${
                      editPriority === 'medium'
                        ? 'bg-amber-950 border-amber-500 text-amber-300'
                        : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-800'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPriority('high')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition ${
                      editPriority === 'high'
                        ? 'bg-red-950 border-destructive text-red-300'
                        : 'bg-zinc-900 border-border text-muted-foreground hover:bg-zinc-800'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-destructive" /> High
                  </button>
                </div>
              </div>
            )}

            {selectedTask && (
              <div>
                <label className="font-medium text-muted-foreground block mb-1">Assignee</label>
                <select
                  value={editAssigneeId || ''}
                  onChange={(e) => setEditAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-md border border-border bg-zinc-900 p-2 text-xs text-foreground-secondary focus:outline-none focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="">Unassigned</option>
                  {groupMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.username} {m.id === currentUser.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={editStart}
                  onChange={(e) => {
                    setEditStart(e.target.value)
                    if (selectedEvent) setEditEnd(e.target.value)
                  }}
                  className="mt-1 border-border bg-zinc-900 text-foreground-secondary"
                />
              </div>
              {selectedTask && (
                <div>
                  <label className="font-medium text-muted-foreground">End Date</label>
                  <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="mt-1 border-border bg-zinc-900 text-foreground-secondary" />
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-muted-foreground hover:bg-accent hover:text-accent-foreground">Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {selectedTask && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      selectedTask.priority === 'high'
                        ? 'bg-destructive'
                        : selectedTask.priority === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {selectedTask.priority || 'medium'} priority
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground-secondary">{selectedTask.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {selectedTask.description || <span className="italic text-muted-foreground-subtle">No description provided.</span>}
                </p>
              </div>
            )}

            {selectedEvent && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                    Event
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground-secondary">{selectedEvent.title}</h3>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-border bg-zinc-900/50 p-3 text-xs">
              <div>
                <span className="font-medium text-muted-foreground block">Author:</span>
                <span className="text-foreground-secondary">
                  {selectedTask?.author?.username || selectedEvent?.author?.username || 'Unknown'}
                </span>
              </div>
              {selectedTask && (
                <div>
                  <span className="font-medium text-muted-foreground block">Assignee:</span>
                  <span className="text-foreground-secondary font-medium">{selectedTask.assignee?.username || 'Unassigned'}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div>
                  <span className="font-medium text-muted-foreground block">Start:</span>
                  <span className="text-foreground-secondary">{selectedTask?.startDate || selectedEvent?.startDate || '-'}</span>
                </div>
                {selectedTask && (
                  <div>
                    <span className="font-medium text-muted-foreground block">End:</span>
                    <span className="text-foreground-secondary">{selectedTask.endDate || '-'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {!isEditing && canModifySelected && (
        <div className="pt-4 border-t border-border mt-4">
          {selectedTask && (
            <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(selectedTask.id)} className="w-full text-destructive hover:bg-red-950/30 hover:text-red-300">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Task
            </Button>
          )}
          {selectedEvent && (
            <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(selectedEvent.id)} className="w-full text-destructive hover:bg-red-950/30 hover:text-red-300">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Event
            </Button>
          )}
        </div>
      )}
    </div>
  )
}