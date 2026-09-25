import type { TaskDto } from "@/components/webSockets/useStomp"

export interface BoardColumn {
  id: number
  name: string
  position: number
  numTasks?: number
  tasks?: TaskDto[]
}

export interface CreateColumnRequest {
  name: string
}