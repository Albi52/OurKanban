import { apiGet, apiPost, apiPatch, apiDelete } from './client'
import type { ProjectSummary, CreateProjectRequest, UpdateProjectRequest } from '../types/workgroup'

export function getProject(projectId: number): Promise<ProjectSummary> {
  return apiGet<ProjectSummary>(`/projects/${projectId}`)
}

export function createProject(
  workGroupId: number,
  request: CreateProjectRequest
): Promise<ProjectSummary> {
  return apiPost<ProjectSummary>(`/workgroups/${workGroupId}/projects`, request)
}

export function renameProject(
  projectId: number,
  request: UpdateProjectRequest
): Promise<ProjectSummary> {
  return apiPatch<ProjectSummary>(`/projects/${projectId}`, request)
}

export function deleteProject(projectId: number): Promise<void> {
  return apiDelete<void>(`/projects/${projectId}`)
}