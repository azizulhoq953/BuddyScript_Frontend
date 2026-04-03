import type { ApiResponse, Comment, CreatePostPayload, FeedReaction, Post, Reply } from '../types'
import { getStoredToken } from './auth.service'
import { http } from './http'

function deriveImageBaseUrl() {
  const explicitImageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL?.trim()
  if (explicitImageBaseUrl) {
    return explicitImageBaseUrl.replace(/\/$/, '')
  }

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? http.API_BASE_URL).replace(/\/$/, '')
  return apiBaseUrl.replace(/\/api\/v1$/, '')
}

const IMAGE_BASE_URL = deriveImageBaseUrl()

function readData<T>(value: T | ApiResponse<T>): T {
  if (typeof value === 'object' && value !== null && 'data' in value) {
    return (value as ApiResponse<T>).data
  }

  return value as T
}

function readArray<T>(value: T[] | ApiResponse<T[]>): T[] {
  const data = readData(value)
  return Array.isArray(data) ? data : []
}

function toAbsoluteImageUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) {
    return undefined
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }

  return `${IMAGE_BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

async function postLike(path: string, isLiked: boolean, token: string) {
  await http.request(
    path,
    {
      method: 'POST',
      body: JSON.stringify({ isLiked }),
    },
    token,
  )
}

async function getPostLikers(postId: string, token: string) {
  try {
    const response = await http.request<FeedReaction[] | ApiResponse<FeedReaction[]>>(`/post/likes/${postId}`, { method: 'GET' }, token)
    return readArray(response)
  } catch {
    return []
  }
}

async function getCommentLikers(commentId: string, token: string) {
  try {
    const response = await http.request<FeedReaction[] | ApiResponse<FeedReaction[]>>(`/post/comments/likes/${commentId}`, { method: 'GET' }, token)
    return readArray(response)
  } catch {
    return []
  }
}

async function getReplyLikers(replyId: string, token: string) {
  try {
    const response = await http.request<FeedReaction[] | ApiResponse<FeedReaction[]>>(`/post/comnt-replies/likes/${replyId}`, { method: 'GET' }, token)
    return readArray(response)
  } catch {
    return []
  }
}

async function getReplies(commentId: string, token: string) {
  const response = await http.request<Reply[] | ApiResponse<Reply[]>>(`/post/comments/replies/${commentId}`, { method: 'GET' }, token)
  const replies = readArray(response)

  const repliesWithLikers = await Promise.all(
    replies.map(async (reply) => ({
      ...reply,
      likedBy: await getReplyLikers(reply._id, token),
    })),
  )

  return repliesWithLikers
}

async function getComments(postId: string, token: string) {
  const response = await http.request<Comment[] | ApiResponse<Comment[]>>(`/post/comments/${postId}`, { method: 'GET' }, token)
  const comments = readArray(response)

  const commentsWithChildren = await Promise.all(
    comments.map(async (comment) => ({
      ...comment,
      likedBy: await getCommentLikers(comment._id, token),
      replies: await getReplies(comment._id, token),
    })),
  )

  return commentsWithChildren
}

export async function getFeedPosts(): Promise<Post[]> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  const response = await http.request<Post[] | ApiResponse<Post[]>>('/post', { method: 'GET' }, token)
  const posts = readArray(response)

  const normalizedPosts = await Promise.all(
    posts.map(async (post) => {
      const firstImage = post.image ?? post.images?.[0]
      return {
        ...post,
        image: toAbsoluteImageUrl(firstImage),
        images: (post.images ?? []).map((imagePath) => toAbsoluteImageUrl(imagePath) ?? imagePath),
        likedBy: await getPostLikers(post._id, token),
        comments: await getComments(post._id, token),
      }
    }),
  )

  return normalizedPosts.sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt))
}

export async function createPost(payload: CreatePostPayload): Promise<void> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  const formData = new FormData()
  formData.append('text', payload.text)
  formData.append('visibility', payload.visibility)
  const images = payload.images ?? (payload.image ? [payload.image] : [])

  if (images.length > 0) {
    images.forEach((image) => {
      formData.append('image', image)
    })
  }

  await http.request('/post', { method: 'POST', body: formData }, token)
}

export async function togglePostLike(postId: string, isCurrentlyLiked: boolean): Promise<void> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  await postLike(`/post/likes/${postId}`, !isCurrentlyLiked, token)
}

export async function addComment(postId: string, content: string): Promise<void> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  await http.request(
    `/post/comments/${postId}`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
    token,
  )
}

export async function toggleCommentLike(commentId: string, isCurrentlyLiked: boolean): Promise<void> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  await postLike(`/post/comments/likes/${commentId}`, !isCurrentlyLiked, token)
}

export async function addReply(commentId: string, content: string): Promise<void> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  await http.request(
    `/post/comments/replies/${commentId}`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    },
    token,
  )
}

export async function toggleReplyLike(replyId: string, isCurrentlyLiked: boolean): Promise<void> {
  const token = getStoredToken()
  if (!token) {
    throw new Error('Unauthorized')
  }

  await postLike(`/post/comnt-replies/likes/${replyId}`, !isCurrentlyLiked, token)
}
