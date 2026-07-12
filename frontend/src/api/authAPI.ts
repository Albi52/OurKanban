import { apiPost, apiGet } from './client'
import type { LoginRequest, RegisterRequest, AuthResponse, GoogleLoginRequest, MeResponse} from '../types/auth'


export function login(request: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', request)
}

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', request)
}

export function loginWithGoogle(request: GoogleLoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login/google', request)
}
export function getMe(): Promise<MeResponse> {
  return apiGet<MeResponse>('/auth/me')
}

export function resendVerification(): Promise<void> {
  return apiPost<void>('/auth/resend-verification', {})
}