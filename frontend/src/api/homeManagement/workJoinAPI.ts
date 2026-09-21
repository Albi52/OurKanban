import type { WorkGroupJoinResponse } from '@app-types/workgroup'
import { apiGet, apiPost, apiPatch, apiDelete } from '@api/client'
import type { UserSearchResult } from '@app-types/user'

export function getMyPendingJoinRequests() {
  return apiGet<WorkGroupJoinResponse[]>('/join/mine')
}

export function getPendingJoinRequestsOfGroup(workGroupId: number) {
  return apiGet<UserSearchResult[]>(`/join/${workGroupId}`)
}

export function sendJoinRequest(workGroupId: number, username: string) {
  return apiPost<void>('/join', { workGroupId, username })
}

export function cancelJoinRequest(workGroupId: number, username: string) {
  return apiDelete<void>('/join', { workGroupId, username })
}

export function acceptJoinRequest(workGroupId: number) {
  return apiPatch<void>(`/join/accept/${workGroupId}`, {})
}

export function declineJoinRequest(workGroupId: number) {
  return apiPatch<void>(`/join/decline/${workGroupId}`, {})
}