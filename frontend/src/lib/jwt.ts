export interface DecodedToken {
  username: string
  exp: number
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1]
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return { username: json.sub, exp: json.exp }
  } catch {
    return null
  }
}