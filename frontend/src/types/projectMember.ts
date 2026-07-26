export interface ProjectMember {
  id: number
  userId: number
  username: string
  displayName: string
  profilePicture: string | null
}

export interface UpdateDisplayNameRequest {
  displayName: string
}