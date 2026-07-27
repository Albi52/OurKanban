import { apiGet } from './client'
import type { UserSearchResult } from '../types/user'

export function searchUsers(query: string): Promise<UserSearchResult[]> {
  return apiGet<UserSearchResult[]>(`/users/search?query=${encodeURIComponent(query)}`)
}