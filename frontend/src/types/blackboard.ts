export type ElementType = 'TEXT' | 'IMAGE' | 'BOTH'
export type GridEdge = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT'

export interface BlackboardElementDto {
  id: number 
  row: number | null
  col: number | null
  width: number
  height: number
  type: ElementType
  textContent: string | null
  imageUrl: string | null
  creatorId: number | null
  creatorName: string | null
  creatorProfilePicture: string | null
  createdAt: string | null
  version: number
}

export interface BlackboardDto {
  id: number
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
  elements: BlackboardElementDto[]
}