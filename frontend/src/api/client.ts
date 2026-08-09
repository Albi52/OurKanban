import { TOKEN_STORAGE_KEY } from '@/constants'
import { notifyUnauthorized } from '@api/account/authEvents'

const API_PREFIX = "/api";


function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

async function request<TResponse>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<TResponse> {
  const token = getToken()
  const res = await fetch(`${API_PREFIX}${path}`, {

    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    // Only a genuine session-expiry case if this request WAS carrying a token
    // and got rejected anyway. A request with no token (e.g. login) that comes
    // back 401 was never an authenticated session to begin with — it's a fresh
    // credentials check, so let the backend's specific error message through
    // instead of overwriting it with "session expired".
    if (token) {
      notifyUnauthorized()
      throw new Error('Session expired. Please log in again.')
    }
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.error ?? 'Invalid credentials')
  }

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

export async function apiUpload<TResponse>(path: string, file: File): Promise<TResponse> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_PREFIX}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    // Deliberately no Content-Type header — the browser sets the correct
    // multipart boundary automatically. Setting it manually breaks the upload.
    body: formData,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.error ?? `Request failed with status ${res.status}`)
  }

  return res.json() as Promise<TResponse>
}