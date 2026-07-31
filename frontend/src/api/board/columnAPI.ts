import { apiGet, apiPost } from '@api/client'
import type { BoardColumn } from '@app-types/board'

export function getColumns(projectId: number): Promise<BoardColumn[]> {
  return apiGet<BoardColumn[]>(`/projects/${projectId}/columns`)
}

export function addColumn(projectId: number, name: string): Promise<BoardColumn> {
  return apiPost<BoardColumn>(`/projects/${projectId}/columns`, { name })
}