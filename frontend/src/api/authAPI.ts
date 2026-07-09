import { apiPost } from './client'
import type { LoginRequest, RegisterRequest, AuthResponse, GoogleLoginRequest} from '../types/auth'

export function login(request: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', request)
}

export function register(request: RegisterRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', request)
}

export function loginWithGoogle(request: GoogleLoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login/google', request)
}