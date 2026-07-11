import { apiGet, apiPost, apiDelete } from './client'
import type { WorkGroup, CreateWorkGroupRequest, AddMemberRequest } from '../types/workgroup'

export function getMyWorkGroups(): Promise<WorkGroup[]> {
  return apiGet<WorkGroup[]>('/workgroups/mine')
}

export function createWorkGroup(request: CreateWorkGroupRequest): Promise<WorkGroup> {
  return apiPost<WorkGroup>('/workgroups', request)
}

export function leaveWorkGroup(id: number): Promise<void> {
  return apiDelete<void>(`/workgroups/${id}/leave`)
}

export function addMember(workGroupId: number, request: AddMemberRequest): Promise<WorkGroup> {
  return apiPost<WorkGroup>(`/workgroups/${workGroupId}/members`, request)
}

export function removeMember(workGroupId: number, userId: number): Promise<WorkGroup> {
  return apiDelete<WorkGroup>(`/workgroups/${workGroupId}/members/${userId}`)
}