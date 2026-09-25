import { apiGet } from '@api/client'
import type { EventDto } from '@/components/webSockets/useStomp'

export interface CalendarResponse {
  projectId: number
  size: number
  events: EventDto[]
}

export async function getEvents(projectId: number): Promise<EventDto[]> {
  const response = await apiGet<CalendarResponse[] | CalendarResponse>(`/projects/${projectId}/calendar`)
  const calendar = Array.isArray(response) ? response[0] : response
  return calendar?.events || []
}