import { apiGet } from '@api/client'
import type { EventDto } from '@/components/webSockets/useStomp'

export function getEvents(projectId: number): Promise<EventDto[]> {
  return apiGet<EventDto[]>(`/projects/${projectId}/events`)
}