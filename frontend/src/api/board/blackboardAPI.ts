import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '@api/client'
import type { BlackboardDto, BlackboardElementDto, ElementType, GridEdge } from '@app-types/blackboard'

const base = (projectId: number) => `/projects/${projectId}/blackboard`

export function getBlackboard(projectId: number) {
  return apiGet<BlackboardDto>(base(projectId))
}

export function addElement(
  projectId: number,
  data: { row?: number; col?: number; width: number; height: number; type: ElementType; textContent?: string }
) {
  return apiPost<BlackboardElementDto>(`${base(projectId)}/elements`, data)
}

export function updateGeometry(
  projectId: number,
  elementId: number,
  data: { row?: number; col?: number; width: number; height: number }
) {
  return apiPatch<BlackboardElementDto>(`${base(projectId)}/elements/${elementId}/geometry`, data)
}

export function updateContent(projectId: number, elementId: number, data: { textContent: string }) {
  return apiPatch<BlackboardElementDto>(`${base(projectId)}/elements/${elementId}/content`, data)
}

export function uploadElementImage(projectId: number, elementId: number, file: File) {
  return apiUpload<BlackboardElementDto>(`${base(projectId)}/elements/${elementId}/image`, file)
}

export function deleteElement(projectId: number, elementId: number) {
  return apiDelete<void>(`${base(projectId)}/elements/${elementId}`)
}
export function unstageElement(projectId: number, elementId: number) {
  return apiPatch<BlackboardElementDto>(`${base(projectId)}/elements/${elementId}/unstage`, {})
}

export function addRow(projectId: number, edge: GridEdge) {
  return apiPost<BlackboardDto>(`${base(projectId)}/rows/${edge}`, {})
}

export function addColumn(projectId: number, edge: GridEdge) {
  return apiPost<BlackboardDto>(`${base(projectId)}/columns/${edge}`, {})
}
export function shrinkToFit(projectId: number) {
  return apiPost<BlackboardDto>(`${base(projectId)}/shrink-to-fit`, {})
}