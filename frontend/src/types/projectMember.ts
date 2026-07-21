export interface ProjectMember {
  id: number
  userId: number
  username: string
  displayName: string
}

export interface UpdateDisplayNameRequest {
  displayName: string
}