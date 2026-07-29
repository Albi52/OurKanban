type UnauthorizedHandler = () => void

let handler: UnauthorizedHandler | null = null

export function registerUnauthorizedHandler(fn: UnauthorizedHandler) {
  handler = fn
}

export function notifyUnauthorized() {
  handler?.()
}