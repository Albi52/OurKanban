import { apiGet, apiPatch } from './client'
import type { ProjectMember, UpdateDisplayNameRequest } from '../types/projectMember'

export function getProjectMembers(projectId: number): Promise<ProjectMember[]> {
  return apiGet<ProjectMember[]>(`/projects/${projectId}/members`)
}

export function updateDisplayName(
  projectId: number,
  memberId: number,
  request: UpdateDisplayNameRequest
): Promise<ProjectMember> {
  return apiPatch<ProjectMember>(`/projects/${projectId}/members/${memberId}/display-name`, request)
}