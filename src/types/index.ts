export type Visibility = 'PUBLIC' | 'PRIVATE'

export type UserRole = 'GENERAL' | 'ADMIN'

export interface User {
  _id: string
  firstName: string
  lastName: string
  role?: UserRole
  profile?: string
  email?: string
}

export interface AuthUser extends User {
  email: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface VerifyEmailPayload {
  email: string
  oneTimeCode: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPage: number
  }
  data: T
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface FeedReaction {
  _id: string
  firstName: string
  lastName: string
  role: UserRole
  profile?: string
}

export interface Reply {
  _id: string
  post: string
  author: User
  content: string
  parentComment: string
  likeCount: number
  replyCount: number
  createdAt: string
  updatedAt: string
  isLiked: boolean
  likedBy?: FeedReaction[]
}

export interface Comment {
  _id: string
  post: string
  author: User
  content: string
  parentComment: null
  likeCount: number
  replyCount: number
  createdAt: string
  updatedAt: string
  isLiked: boolean
  replies?: Reply[]
  likedBy?: FeedReaction[]
}

export interface Post {
  _id: string
  author: User
  text: string
  image?: string
  visibility: Visibility
  likeCount: number
  commentCount: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
  comments?: Comment[]
  likedBy?: FeedReaction[]
}

export interface CreatePostPayload {
  text: string
  visibility: Visibility
  image?: File | null
}
