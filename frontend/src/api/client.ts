import { TOKEN_STORAGE_KEY } from '../constants'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

async function request<TResponse>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<TResponse> {
  const token = getToken()

  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.error ?? `Request failed with status ${res.status}`)
  }

  if (res.status === 204) {
    return undefined as TResponse
  }

  return res.json() as Promise<TResponse>
}

export function apiGet<TResponse>(path: string): Promise<TResponse> {
  return request<TResponse>(path, 'GET')
}

export function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  return request<TResponse>(path, 'POST', body)
}

export function apiPatch<TResponse>(path: string, body: unknown): Promise<TResponse> {
  return request<TResponse>(path, 'PATCH', body)
}

export function apiDelete<TResponse>(path: string): Promise<TResponse> {
  return request<TResponse>(path, 'DELETE')
}