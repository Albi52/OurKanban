export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface GoogleLoginRequest {
  idToken: string
}

export interface AuthResponse {
  token: string | null
  message?: string | null
}

export interface MeResponse {
  username: string
  emailVerified: boolean
  localCredentialsPending: boolean
  hasLocalPassword: boolean
}

export interface UpdateUsernameRequest {
  newUsername: string
}

export interface UpdatePasswordRequest {
  currentPassword: string | null
  newPassword: string
}