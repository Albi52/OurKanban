export type AttachmentType = 'NONE' | 'IMAGE' | 'PDF' | 'LINK'
export type GridEdge = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT'

export interface BlackboardElementDto {
  id: number
  row: number | null
  col: number | null
  width: number
  height: number
  attachmentType: AttachmentType
  textContent: string | null
  imageUrl: string | null
  pdfUrl: string | null
  pdfThumbnailUrl: string | null
  pdfFileName: string | null
  linkUrl: string | null
  creatorId: number | null
  creatorName: string | null
  creatorProfilePicture: string | null
  createdAt: string | null
  version: number
}

export interface PlacedBlackboardElement extends BlackboardElementDto {
  row: number
  col: number
}

export interface BlackboardDto {
  id: number
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
  elements: BlackboardElementDto[]
}

export interface LinkPreviewDto {
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
  url: string
}

export interface PlacementRect {
  row: number
  col: number
  width: number
  height: number
}