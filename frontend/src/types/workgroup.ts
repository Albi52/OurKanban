export interface ProjectSummary {
  id: number
  name: string
  workGroupId: number
  isLeader: boolean
}
export interface Member {
  id: number
  username: string
}

export interface WorkGroup {
  id: number
  name: string
  leaderUsername: string
  isLeader: boolean
  projects: ProjectSummary[]
  members: Member[]
}

export interface CreateWorkGroupRequest {
  name: string
}

export interface CreateProjectRequest {
  name: string
}

export interface UpdateProjectRequest {
  name: string
}

export interface AddMemberRequest {
  username: string
}