const STORAGE_PREFIX = 'ourkanban_recent'

interface RecentActivityData {
  groups: Record<number, number>
  projects: Record<number, number>
}

function storageKey(username: string): string {
  return `${STORAGE_PREFIX}:${username}`
}

function load(username: string): RecentActivityData {
  try {
    const raw = localStorage.getItem(storageKey(username))
    if (!raw) return { groups: {}, projects: {} }
    const parsed = JSON.parse(raw)
    return {
      groups: parsed.groups ?? {},
      projects: parsed.projects ?? {},
    }
  } catch {
    return { groups: {}, projects: {} }
  }
}

function save(username: string, data: RecentActivityData) {
  try {
    localStorage.setItem(storageKey(username), JSON.stringify(data))
  } catch {
    // Storage full/unavailable — recency ordering just won't persist, not critical
  }
}

export function recordProjectOpened(username: string, projectId: number, groupId?: number) {
  const data = load(username)
  const now = Date.now()
  data.projects[projectId] = now
  if (groupId !== undefined) {
    data.groups[groupId] = now
  }
  save(username, data)
}

export function recordGroupOpened(username: string, groupId: number) {
  const data = load(username)
  data.groups[groupId] = Date.now()
  save(username, data)
}

export function getProjectRecency(username: string, projectId: number): number {
  return load(username).projects[projectId] ?? 0
}

export function getGroupRecency(username: string, groupId: number): number {
  return load(username).groups[groupId] ?? 0
}