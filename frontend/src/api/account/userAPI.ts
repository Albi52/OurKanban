import { apiGet } from '@api/client'
import type { UserSearchResult } from '@app-types/user'

export function searchUsers(query: string): Promise<UserSearchResult[]> {
  return apiGet<UserSearchResult[]>(`/users/search?query=${encodeURIComponent(query)}`)
}