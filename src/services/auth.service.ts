import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types'
import { http } from './http'

const TOKEN_KEY = 'buddy_token'
const USER_KEY = 'buddy_user'
const USERS_KEY = 'buddy_users'

function readUsers(): Array<User & { password: string }> {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    return []
  }

  return JSON.parse(raw) as Array<User & { password: string }>
}

function saveUsers(users: Array<User & { password: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function persistSession(payload: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, payload.token)
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
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
  localStorage.removeItem(USER_KEY)
}

function toAuthResponse(user: User): AuthResponse {
  return {
    token: `local-token-${user.id}`,
    user,
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const response = await http.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    persistSession(response)
    return response
  } catch {
    const users = readUsers()
    const exists = users.some((item) => item.email.toLowerCase() === payload.email.toLowerCase())

    if (exists) {
      throw new Error('Email already registered')
    }

    const user: User = {
      id: crypto.randomUUID(),
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
    }

    users.push({ ...user, password: payload.password })
    saveUsers(users)

    const authResponse = toAuthResponse(user)
    persistSession(authResponse)
    return authResponse
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const response = await http.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    persistSession(response)
    return response
  } catch {
    const users = readUsers()
    const found = users.find(
      (item) => item.email.toLowerCase() === payload.email.toLowerCase() && item.password === payload.password,
    )

    if (!found) {
      throw new Error('Invalid email or password')
    }

    const { password, ...user } = found
    void password
    const authResponse = toAuthResponse(user)
    persistSession(authResponse)
    return authResponse
  }
}

export async function me(token: string): Promise<User | null> {
  try {
    return await http.request<User>('/auth/me', { method: 'GET' }, token)
  } catch {
    return getStoredUser()
  }
}
