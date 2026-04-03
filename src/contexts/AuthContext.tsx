import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LoginPayload, RegisterPayload, ResendOtpPayload, SocialLoginPayload, VerifyEmailPayload } from '../types'
import {
clearSession,
getStoredToken,
getStoredUser,
login,
me,
register,
resendOtp,
socialLogin,
verifyEmail,
} from '../services/auth.service'

interface AuthContextValue {
user: ReturnType<typeof getStoredUser>
token: string | null
loading: boolean
loginUser: (payload: LoginPayload) => Promise<void>
registerUser: (payload: RegisterPayload) => Promise<void>
socialLoginUser: (payload: SocialLoginPayload) => Promise<void>
verifyUserEmail: (payload: VerifyEmailPayload) => Promise<void>
resendVerificationOtp: (payload: ResendOtpPayload) => Promise<void>
logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
const [user, setUser] = useState(getStoredUser())
const [token, setToken] = useState<string | null>(getStoredToken())
const [loading, setLoading] = useState(true)

useEffect(() => {
const bootstrap = async () => {
if (!token) {
setLoading(false)
return
}

const meUser = await me(token)
setUser(meUser)
if (!meUser) {
clearSession()
setToken(null)
}
setLoading(false)
}

void bootstrap()
}, [token])

const value = useMemo<AuthContextValue>(
() => ({
user,
token,
loading,
loginUser: async (payload) => {
const response = await login(payload)
setUser(response.user)
setToken(response.token)
},
registerUser: async (payload) => {
await register(payload)
},
socialLoginUser: async (payload) => {
const response = await socialLogin(payload)
setUser(response.user)
setToken(response.token)
},
verifyUserEmail: async (payload) => {
await verifyEmail(payload)
},
resendVerificationOtp: async (payload) => {
await resendOtp(payload)
},
logout: () => {
clearSession()
setUser(null)
setToken(null)
},
}),
[loading, token, user],
)

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
const context = useContext(AuthContext)

if (!context) {
throw new Error('useAuth must be used within AuthProvider')
}

return context
}
