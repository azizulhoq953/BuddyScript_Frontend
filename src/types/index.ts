export type Visibility = 'PUBLIC' | 'PRIVATE'

export interface User {
  id: string
  firstName: string
  lastName: string
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

export interface AuthResponse {
  token: string
  user: User
}

export interface FeedReaction {
  userId: string
  name: string
}

export interface Reply {
  id: string
  commentId: string
  user: User
  text: string
  likedBy: FeedReaction[]
  createdAt: string
}

export interface Comment {
  id: string
  postId: string
  user: User
  text: string
  likedBy: FeedReaction[]
  createdAt: string
  replies: Reply[]
}

export interface Post {
  id: string
  author: User
  text: string
  imageUrl?: string
  visibility: Visibility
  likedBy: FeedReaction[]
  comments: Comment[]
  createdAt: string
}

export interface CreatePostPayload {
  text: string
  visibility: Visibility
  image?: File | null
}
