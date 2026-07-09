export async function apiPost<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.error ?? `Request failed with status ${res.status}`)
  }

  return res.json() as Promise<TResponse>
}