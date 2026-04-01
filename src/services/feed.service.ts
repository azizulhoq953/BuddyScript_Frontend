import type { Comment, CreatePostPayload, FeedReaction, Post, Reply, User } from '../types'
import { getStoredToken, getStoredUser } from './auth.service'
import { http } from './http'

const POSTS_KEY = 'buddy_posts'

function readPosts(): Post[] {
  const raw = localStorage.getItem(POSTS_KEY)
  if (!raw) {
    return []
  }

  return JSON.parse(raw) as Post[]
}

function savePosts(posts: Post[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
}

function asReaction(user: User): FeedReaction {
  return {
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`,
  }
}

function toggleLike(reactions: FeedReaction[], user: User): FeedReaction[] {
  const exists = reactions.some((item) => item.userId === user.id)
  if (exists) {
    return reactions.filter((item) => item.userId !== user.id)
  }

  return [asReaction(user), ...reactions]
}

function ensureSeedData() {
  const posts = readPosts()
  if (posts.length > 0) {
    return
  }

  const currentUser = getStoredUser()
  if (!currentUser) {
    return
  }

  const seeded: Post[] = [
    {
      id: crypto.randomUUID(),
      author: currentUser,
      text: 'Welcome to Buddy Script! This is your first post.',
      visibility: 'PUBLIC',
      likedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
    },
  ]

  savePosts(seeded)
}

function visiblePosts(posts: Post[], currentUserId: string): Post[] {
  return posts
    .filter((item) => item.visibility === 'PUBLIC' || item.author.id === currentUserId)
    .sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt))
}

export async function getFeedPosts(): Promise<Post[]> {
  const token = getStoredToken()
  const currentUser = getStoredUser()

  if (!currentUser) {
    return []
  }

  try {
    return await http.request<Post[]>('/feed/posts', { method: 'GET' }, token ?? undefined)
  } catch {
    ensureSeedData()
    return visiblePosts(readPosts(), currentUser.id)
  }
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const token = getStoredToken()
  const currentUser = getStoredUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  try {
    const formData = new FormData()
    formData.append('text', payload.text)
    formData.append('visibility', payload.visibility)
    if (payload.image) {
      formData.append('image', payload.image)
    }

    return await http.request<Post>(
      '/feed/posts',
      {
        method: 'POST',
        body: formData,
      },
      token ?? undefined,
    )
  } catch {
    const imageUrl = payload.image ? URL.createObjectURL(payload.image) : undefined

    const post: Post = {
      id: crypto.randomUUID(),
      author: currentUser,
      text: payload.text,
      visibility: payload.visibility,
      imageUrl,
      likedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
    }

    const posts = [post, ...readPosts()]
    savePosts(posts)

    return post
  }
}

export async function togglePostLike(postId: string): Promise<Post[]> {
  const token = getStoredToken()
  const currentUser = getStoredUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  try {
    return await http.request<Post[]>(`/feed/posts/${postId}/likes/toggle`, { method: 'PATCH' }, token ?? undefined)
  } catch {
    const updated = readPosts().map((post) => {
      if (post.id !== postId) {
        return post
      }

      return {
        ...post,
        likedBy: toggleLike(post.likedBy, currentUser),
      }
    })

    savePosts(updated)
    return visiblePosts(updated, currentUser.id)
  }
}

export async function addComment(postId: string, text: string): Promise<Post[]> {
  const token = getStoredToken()
  const currentUser = getStoredUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  try {
    return await http.request<Post[]>(
      `/feed/posts/${postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      },
      token ?? undefined,
    )
  } catch {
    const comment: Comment = {
      id: crypto.randomUUID(),
      postId,
      text,
      user: currentUser,
      likedBy: [],
      createdAt: new Date().toISOString(),
      replies: [],
    }

    const updated = readPosts().map((post) =>
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
    )

    savePosts(updated)
    return visiblePosts(updated, currentUser.id)
  }
}

export async function toggleCommentLike(postId: string, commentId: string): Promise<Post[]> {
  const token = getStoredToken()
  const currentUser = getStoredUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  try {
    return await http.request<Post[]>(
      `/feed/posts/${postId}/comments/${commentId}/likes/toggle`,
      { method: 'PATCH' },
      token ?? undefined,
    )
  } catch {
    const updated = readPosts().map((post) => {
      if (post.id !== postId) {
        return post
      }

      return {
        ...post,
        comments: post.comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likedBy: toggleLike(comment.likedBy, currentUser),
              }
            : comment,
        ),
      }
    })

    savePosts(updated)
    return visiblePosts(updated, currentUser.id)
  }
}

export async function addReply(postId: string, commentId: string, text: string): Promise<Post[]> {
  const token = getStoredToken()
  const currentUser = getStoredUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  try {
    return await http.request<Post[]>(
      `/feed/posts/${postId}/comments/${commentId}/replies`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      },
      token ?? undefined,
    )
  } catch {
    const reply: Reply = {
      id: crypto.randomUUID(),
      commentId,
      text,
      user: currentUser,
      likedBy: [],
      createdAt: new Date().toISOString(),
    }

    const updated = readPosts().map((post) => {
      if (post.id !== postId) {
        return post
      }

      return {
        ...post,
        comments: post.comments.map((comment) =>
          comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment,
        ),
      }
    })

    savePosts(updated)
    return visiblePosts(updated, currentUser.id)
  }
}

export async function toggleReplyLike(postId: string, commentId: string, replyId: string): Promise<Post[]> {
  const token = getStoredToken()
  const currentUser = getStoredUser()

  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  try {
    return await http.request<Post[]>(
      `/feed/posts/${postId}/comments/${commentId}/replies/${replyId}/likes/toggle`,
      { method: 'PATCH' },
      token ?? undefined,
    )
  } catch {
    const updated = readPosts().map((post) => {
      if (post.id !== postId) {
        return post
      }

      return {
        ...post,
        comments: post.comments.map((comment) => {
          if (comment.id !== commentId) {
            return comment
          }

          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === replyId
                ? {
                    ...reply,
                    likedBy: toggleLike(reply.likedBy, currentUser),
                  }
                : reply,
            ),
          }
        }),
      }
    })

    savePosts(updated)
    return visiblePosts(updated, currentUser.id)
  }
}
