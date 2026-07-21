export interface BoardColumn {
  id: number
  name: string
  position: number
}

export interface CreateColumnRequest {
  name: string
}