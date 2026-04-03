import type {
  ApiResponse,
  AuthResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ResendOtpPayload,
  SocialLoginPayload,
  User,
  VerifyEmailPayload,
} from '../types'
import { http } from './http'

const TOKEN_KEY = 'buddy_token'
const REFRESH_TOKEN_KEY = 'buddy_refresh_token'
const USER_KEY = 'buddy_user'

function persistSession(payload: AuthResponse, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, payload.token)
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

function readData<T>(value: T | ApiResponse<T>): T {
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return (value as ApiResponse<T>).data
  }

  return value as T
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }

  return JSON.parse(raw) as User
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function register(payload: RegisterPayload) {
  return await http.request<ApiResponse<null> | { success: boolean; message: string }>('/user', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      role: 'GENERAL',
    }),
  })
}

export async function verifyEmail(payload: VerifyEmailPayload) {
  return await http.request<ApiResponse<null> | { success: boolean; message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function resendOtp(payload: ResendOtpPayload) {
  return await http.request<ApiResponse<null> | { success: boolean; message: string }>('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function socialLogin(payload: SocialLoginPayload): Promise<AuthResponse> {
  const loginResponse = await http.request<ApiResponse<LoginResponse> | LoginResponse>('/auth/social-login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const loginData = readData(loginResponse)
  const accessToken = loginData.accessToken
  const refreshToken = loginData.refreshToken

  let user: AuthResponse['user']
  try {
    const userResponse = await http.request<ApiResponse<User> | User>('/user/profile', { method: 'GET' }, accessToken)
    user = readData(userResponse) as AuthResponse['user']
  } catch {
    user = {
      _id: 'social-user',
      firstName: 'User',
      lastName: '',
      email: '',
    }
  }

  const authResponse: AuthResponse = {
    token: accessToken,
    user,
  }
  persistSession(authResponse, refreshToken)
  return authResponse
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const loginResponse = await http.request<ApiResponse<LoginResponse> | LoginResponse>('/auth/email-login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const loginData = readData(loginResponse)
  const accessToken = loginData.accessToken
  const refreshToken = loginData.refreshToken

  // Try to fetch user from /auth/me, fallback to creating minimal user from email
  let user: AuthResponse['user']
  try {
    const userResponse = await http.request<ApiResponse<User> | User>('/user/profile', { method: 'GET' }, accessToken)
    user = readData(userResponse) as AuthResponse['user']
  } catch {
    // If /auth/me doesn't exist, create a minimal user object from login payload
    user = {
      _id: payload.email,
      firstName: 'User',
      lastName: '',
      email: payload.email,
    }
  }

  const authResponse: AuthResponse = {
    token: accessToken,
    user,
  }
  persistSession(authResponse, refreshToken)
  return authResponse
}

export async function me(token: string): Promise<User | null> {
  try {
    const response = await http.request<ApiResponse<User> | User>('/user/profile', { method: 'GET' }, token)
    return readData(response)
  } catch {
    return null
  }
}
