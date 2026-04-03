import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  addComment,
  addReply,
  createPost,
  getFeedPosts,
  toggleCommentLike,
  togglePostLike,
  toggleReplyLike,
} from '../../services/feed.service'
import type { FeedReaction, Post, Visibility } from '../../types'

const REACTION_OPTIONS = [
  { key: 'LIKE', label: 'Like', emoji: '👍', color: '#1877f2' },
  { key: 'LOVE', label: 'Love', emoji: '❤️', color: '#f33e58' },
  { key: 'CARE', label: 'Care', emoji: '🤗', color: '#f7b125' },
  { key: 'HAHA', label: 'Haha', emoji: '😆', color: '#f7b125' },
] as const

const COMPOSER_TOOLBAR_ACTIONS = [
  { label: 'B', title: 'Bold', before: '**', after: '**' },
  { label: 'I', title: 'Italic', before: '_', after: '_' },
  { label: 'U', title: 'Underline', before: '<u>', after: '</u>' },
  { label: 'Quote', title: 'Quote', before: '> ', after: '' },
  { label: '• List', title: 'Bullet list', before: '\n- ', after: '' },
  { label: '1. List', title: 'Numbered list', before: '\n1. ', after: '' },
  { label: 'Link', title: 'Link', before: '[', after: '](https://)' },
] as const

type ReactionKey = (typeof REACTION_OPTIONS)[number]['key']

function formatRelativeTime(value: string) {
  const diffInSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))

  if (diffInSeconds < 60) {
    return `${diffInSeconds || 1} second${diffInSeconds === 1 ? '' : 's'} ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

function getPostLikeCount(post: Post) {
  return post.likedBy?.length ?? post.likeCount ?? 0
}

function getPostCommentCount(post: Post) {
  return post.comments?.length ?? post.commentCount ?? 0
}

function getCommenterNames(post: Post) {
  const comments = post.comments ?? []
  const uniqueNames = new Set<string>()

  comments.forEach((comment) => {
    uniqueNames.add(`${comment.author.firstName} ${comment.author.lastName}`)
  })

  return [...uniqueNames]
}

function getReactionInitials(reaction: FeedReaction) {
  return `${reaction.firstName.charAt(0)}${reaction.lastName.charAt(0)}`.toUpperCase()
}

function getReactionOption(key: ReactionKey) {
  return REACTION_OPTIONS.find((reaction) => reaction.key === key) ?? REACTION_OPTIONS[0]
}

function getPostImages(post: Post) {
  return (post.images?.length ? post.images : post.image ? [post.image] : []).filter(Boolean)
}

function HoverDetailsCard({
  title,
  total,
  names,
}: {
  title: string
  total: number
  names: string[]
}) {
  return (
    <div className="_feed_hover_detail_card">
      <p className="_feed_hover_detail_title">
        {title}: {total}
      </p>
      {names.length > 0 ? (
        <ul className="_feed_hover_detail_list">
          {names.slice(0, 6).map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="_feed_hover_detail_empty">No one yet</p>
      )}
      {names.length > 6 ? <p className="_feed_hover_detail_more">+{names.length - 6} more</p> : null}
    </div>
  )
}

export function FeedPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [composerText, setComposerText] = useState('')
  const [visibility] = useState<Visibility>('PUBLIC')
  const [images, setImages] = useState<File[]>([])
  const [composerFocused, setComposerFocused] = useState(false)
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [postReactionMap, setPostReactionMap] = useState<Record<string, ReactionKey>>({})
  const [commentReactionMap, setCommentReactionMap] = useState<Record<string, ReactionKey>>({})
  const [replyReactionMap, setReplyReactionMap] = useState<Record<string, ReactionKey>>({})
  const [expandedCommentsByPost, setExpandedCommentsByPost] = useState<Record<string, boolean>>({})
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const canPost = useMemo(() => composerText.trim().length > 0 && !submitting, [composerText, submitting])

  const refreshPosts = async () => {
    const feedPosts = await getFeedPosts()
    setPosts(feedPosts)
  }

  useEffect(() => {
    const bootstrap = async () => {
      try {
        console.log('Fetching feed posts...')
        await refreshPosts()
        console.log('Feed posts loaded successfully')
      } catch (unknownError) {
        const message = unknownError instanceof Error ? unknownError.message : 'Failed to load feed'
        console.error('Feed error:', message, unknownError)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const handleCreatePost = async () => {
    if (!canPost) {
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await createPost({
        text: composerText.trim(),
        image: images[0] ?? null,
        images,
        visibility,
      })
      await refreshPosts()
      setComposerText('')
      setImages([])
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Post creation failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleComposerAction = (before: string, after = '', placeholder = 'text') => {
    const input = composerRef.current
    if (!input) {
      setComposerText((current) => `${current}${before}${placeholder}${after}`)
      return
    }

    const start = input.selectionStart ?? composerText.length
    const end = input.selectionEnd ?? composerText.length
    const selectedText = composerText.slice(start, end) || placeholder
    const nextValue = `${composerText.slice(0, start)}${before}${selectedText}${after}${composerText.slice(end)}`

    setComposerText(nextValue)

    window.requestAnimationFrame(() => {
      const nextCursorStart = start + before.length
      const nextCursorEnd = nextCursorStart + selectedText.length
      input.focus()
      input.setSelectionRange(nextCursorStart, nextCursorEnd)
    })
  }

  const handleComposerImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    if (selectedFiles.length === 0) {
      return
    }

    setImages((current) => [...current, ...selectedFiles])
    event.target.value = ''
  }

  const removeComposerImage = (indexToRemove: number) => {
    setImages((current) => current.filter((_, index) => index !== indexToRemove))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return <div className="_padd_t24 _text_center">Loading feed...</div>
  }

  return (
    <div className="_layout _layout_main_wrapper">
      <div className="_main_layout">
        {/* Header Navigation */}
        <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10 _padd_b10">
          <div className="container _custom_container">
            <div className="_logo_wrap">
              <img src="/assets/images/logo.svg" alt="BuddyScript" className="_nav_logo" />
            </div>
            
            <form className="d-flex gap-2 ms-auto me-4 flex-grow-1" style={{ maxWidth: '300px' }} onSubmit={(e) => e.preventDefault()}>
              <input 
                type="search" 
                className="form-control" 
                placeholder="Search..."
                style={{ borderRadius: '20px' }}
              />
            </form>

            <div className="position-relative">
              <button 
                type="button" 
                className="_btn_profile_dropdown"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <img src="/assets/images/post_img.png" alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              </button>
              
              {showProfileMenu && (
                <div className="dropdown-menu show position-absolute end-0" style={{ top: '100%', marginTop: '10px', minWidth: '180px' }}>
                  <h6 className="dropdown-header">{user?.firstName} {user?.lastName}</h6>
                  <hr className="dropdown-divider" />
                  <button 
                    type="button"
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="container-fluid _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              {/* Left Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12 d-none d-lg-block">
                <div className="_sidebar_left">
                  <div className="_explore_section _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b24">
                    <h5 className="_sidebar_title">Explore</h5>
                    <ul className="list-unstyled">
                      <li className="_sidebar_item _mar_b16"><a href="#0" className="_sidebar_link">Feed</a></li>
                      <li className="_sidebar_item _mar_b16"><a href="#0" className="_sidebar_link">Friends</a></li>
                      <li className="_sidebar_item _mar_b16"><a href="#0" className="_sidebar_link">Messages</a></li>
                      <li className="_sidebar_item _mar_b16"><a href="#0" className="_sidebar_link">Notifications</a></li>
                      <li className="_sidebar_item"><a href="#0" className="_sidebar_link">Settings</a></li>
                    </ul>
                  </div>

                  <div className="_suggested_people _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24">
                    <h5 className="_sidebar_title">Suggested People</h5>
                    <div className="_suggested_person_card _mar_b16">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                          <img src="/assets/images/post_img.png" alt="Person" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <p className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>John Doe</p>
                            <small className="text-muted">Suggested</small>
                          </div>
                        </div>
                        <button className="_btn3" style={{ padding: '4px 12px', fontSize: '12px' }}>Follow</button>
                      </div>
                    </div>
                    <div className="_suggested_person_card _mar_b16">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                          <img src="/assets/images/post_img.png" alt="Person" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <p className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>Jane Smith</p>
                            <small className="text-muted">Suggested</small>
                          </div>
                        </div>
                        <button className="_btn3" style={{ padding: '4px 12px', fontSize: '12px' }}>Follow</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Feed */}
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    {error ? (
                      <div className="alert alert-danger _mar_b16" role="alert">
                        <strong>Error:</strong> {error}
                        <button 
                          className="btn-close" 
                          onClick={() => setError('')}
                          aria-label="Close"
                          style={{ position: 'absolute', right: '12px', top: '12px' }}
                        />
                      </div>
                    ) : null}

                    {/* Post Composer */}
                    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
                      <div className="_feed_inner_text_area_box">
                        <div className="_feed_inner_text_area_box_image">
                          <img src="/assets/images/txt_img.png" alt="Profile" className="_txt_img" />
                        </div>
                        <div className="_feed_composer_editor_wrap w-100">
                          {composerFocused ? (
                            <div className="_feed_composer_toolbar">
                              {COMPOSER_TOOLBAR_ACTIONS.map((action) => (
                                <button
                                  key={action.title}
                                  type="button"
                                  className="_feed_composer_toolbar_btn"
                                  title={action.title}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => handleComposerAction(action.before, action.after, action.label)}
                                >
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          ) : null}

                          <div className="form-floating _feed_inner_text_area_box_form">
                            <textarea
                              ref={composerRef}
                              className="form-control _textarea _feed_composer_textarea"
                              placeholder="Write something ..."
                              value={composerText}
                              onChange={(event) => setComposerText(event.target.value)}
                              onFocus={() => setComposerFocused(true)}
                              onBlur={() => setComposerFocused(false)}
                            />
                            <label className="_feed_textarea_label">Write something ...</label>
                          </div>
                        </div>
                      </div>
                      {composerFocused ? (
                        <div className="_feed_composer_hint">
                          Rich text tools are ready. Format selected text and add multiple images before posting.
                        </div>
                      ) : null}
                      <div className="_feed_inner_text_area_bottom">
                        <div className="_feed_inner_text_area_item">
                          <button
                            type="button"
                            className="_feed_common _feed_inner_text_area_bottom_photo_link"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <span className="_mar_img">Photo</span>
                          </button>

                          <button type="button" className="_feed_common _feed_inner_text_area_bottom_photo_link">
                            <span className="_mar_img">Video</span>
                          </button>

                          <button type="button" className="_feed_common _feed_inner_text_area_bottom_photo_link">
                            <span className="_mar_img">Event</span>
                          </button>

                          <button type="button" className="_feed_common _feed_inner_text_area_bottom_photo_link">
                            <span className="_mar_img">Article</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="_feed_inner_text_area_btn_link"
                          onClick={handleCreatePost}
                          disabled={!canPost}
                        >
                          <span>{submitting ? 'Posting...' : 'Post'}</span>
                        </button>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="d-none"
                        onChange={handleComposerImagesChange}
                      />
                      {images.length > 0 ? (
                        <div className="_feed_selected_images_wrap _mar_t12">
                          <div className="_feed_selected_images_grid">
                            {images.map((file, index) => (
                              <div key={`${file.name}-${file.lastModified}-${index}`} className="_feed_selected_image_card">
                                <img src={URL.createObjectURL(file)} alt={file.name} className="_feed_selected_image" />
                                <button
                                  type="button"
                                  className="_feed_selected_image_remove"
                                  onClick={() => removeComposerImage(index)}
                                  aria-label={`Remove ${file.name}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="_mar_t8 _feed_inner_timline_para">Selected {images.length} image{images.length > 1 ? 's' : ''}</p>
                        </div>
                      ) : null}
                      {error ? <p className="_mar_t16 text-danger">{error}</p> : null}
                    </div>

                    {/* Posts List */}
                    {posts.length === 0 ? (
                      <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16 _padd_r24 _padd_l24">
                        <p className="_feed_inner_timeline_post_box_para">
                          No posts visible yet. Create your first post above.
                        </p>
                      </div>
                    ) : null}

                    {posts.map((post) => {
                      const likeCount = getPostLikeCount(post)
                      const commentCount = getPostCommentCount(post)
                      const allComments = post.comments ?? []
                      const showCommentsSection = expandedCommentsByPost[post._id] ?? false
                      const visibleComments = showCommentsSection ? allComments : []
                      const postImages = getPostImages(post)
                      const likeNames = (post.likedBy ?? []).map((item) => `${item.firstName} ${item.lastName}`)
                      const commentNames = getCommenterNames(post)
                      const topLikers = (post.likedBy ?? []).slice(0, 4)
                      const selectedReactionKey = postReactionMap[post._id] ?? 'LIKE'
                      const selectedReaction = getReactionOption(selectedReactionKey)
                      const reactionLabel = post.isLiked ? selectedReaction.label : 'Like'
                      const reactionColor = post.isLiked ? selectedReaction.color : undefined

                      return (
                      <div key={post._id} className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
                        <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
                          <div className="_feed_inner_timeline_post_top">
                            <div className="_feed_inner_timeline_post_box">
                              <div className="_feed_inner_timeline_post_box_image">
                                <img src={post.author.profile ?? '/assets/images/post_img.png'} alt="" className="_post_img" />
                              </div>
                              <div className="_feed_inner_timeline_post_box_txt">
                                <h4 className="_feed_inner_timeline_post_box_title">
                                  {post.author.firstName} {post.author.lastName}
                                </h4>
                                <p className="_feed_inner_timeline_post_box_para">
                                  {formatRelativeTime(post.createdAt)} · <a href="#0">{post.visibility}</a>
                                </p>
                              </div>
                            </div>
                          </div>
                          <h4 className="_feed_inner_timeline_post_title">{post.text}</h4>
                          {postImages.length > 0 ? (
                            <div className="_feed_inner_timeline_image">
                              {postImages.length === 1 ? (
                                <img src={postImages[0]} alt="post" className="_time_img" />
                              ) : (
                                <div className="_feed_post_gallery">
                                  {postImages.slice(0, 4).map((imageSrc, index) => (
                                    <div key={`${post._id}-${imageSrc}-${index}`} className="_feed_post_gallery_item">
                                      <img src={imageSrc} alt={`post ${index + 1}`} className="_feed_post_gallery_img" />
                                      {index === 3 && postImages.length > 4 ? (
                                        <div className="_feed_post_gallery_more">+{postImages.length - 4}</div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>

                        <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
                          <div className="_feed_react_summary_left">
                            <div className="_feed_react_avatar_stack">
                              {topLikers.map((reaction) =>
                                reaction.profile ? (
                                  <img
                                    key={reaction._id}
                                    src={reaction.profile}
                                    alt={`${reaction.firstName} ${reaction.lastName}`}
                                    className="_feed_react_avatar"
                                  />
                                ) : (
                                  <span key={reaction._id} className="_feed_react_avatar _feed_react_avatar_fallback">
                                    {getReactionInitials(reaction)}
                                  </span>
                                ),
                              )}
                              {likeCount > topLikers.length ? (
                                <span className="_feed_react_avatar _feed_react_avatar_more">+{likeCount - topLikers.length}</span>
                              ) : null}
                            </div>

                            <div className="_feed_hover_detail_wrap">
                              <p className="_feed_inner_timline_para">
                                {likeCount} {likeCount === 1 ? 'React' : 'Reacts'}
                              </p>
                              <HoverDetailsCard title="Reactions" total={likeCount} names={likeNames} />
                            </div>
                          </div>

                          <div className="_feed_inner_timeline_total_reacts_txt">
                            <div className="_feed_hover_detail_wrap">
                              <p
                                className="_feed_inner_timeline_total_reacts_para1"
                                role="button"
                                onClick={() =>
                                  setExpandedCommentsByPost((prev) => ({
                                    ...prev,
                                    [post._id]: !showCommentsSection,
                                  }))
                                }
                                style={{ cursor: 'pointer' }}
                              >
                                <span>{commentCount}</span> Comments
                              </p>
                              <HoverDetailsCard title="Comments" total={commentCount} names={commentNames} />
                            </div>

                            <p className="_feed_inner_timeline_total_reacts_para2">
                              <span>{likeCount}</span> Likes
                            </p>
                          </div>
                        </div>

                        <div className="_feed_inner_timeline_reaction _feed_reaction_bar">
                          <div className="_feed_hover_detail_wrap _feed_reaction_slot _feed_reaction_slot_like">
                            <button
                              className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${post.isLiked ? '_feed_reaction_active' : ''}`}
                              onClick={async () => {
                                try {
                                  await togglePostLike(post._id, post.isLiked)
                                  if (post.isLiked) {
                                    setPostReactionMap((prev) => ({ ...prev, [post._id]: 'LIKE' }))
                                  } else {
                                    setPostReactionMap((prev) => ({ ...prev, [post._id]: prev[post._id] ?? 'LIKE' }))
                                  }
                                  await refreshPosts()
                                } catch (unknownError) {
                                  const message = unknownError instanceof Error ? unknownError.message : 'Unable to react'
                                  setError(message)
                                }
                              }}
                            >
                              <span className="_feed_inner_timeline_reaction_link" style={reactionColor ? { color: reactionColor } : undefined}>
                                {reactionLabel}
                              </span>
                            </button>

                            <div className="_feed_reaction_picker">
                              {REACTION_OPTIONS.map((reaction) => (
                                <button
                                  key={reaction.key}
                                  type="button"
                                  className="_feed_reaction_option"
                                  onClick={async () => {
                                    try {
                                      if (!post.isLiked) {
                                        await togglePostLike(post._id, post.isLiked)
                                      }
                                      setPostReactionMap((prev) => ({ ...prev, [post._id]: reaction.key }))
                                      await refreshPosts()
                                    } catch (unknownError) {
                                      const message = unknownError instanceof Error ? unknownError.message : 'Unable to react'
                                      setError(message)
                                    }
                                  }}
                                  title={reaction.label}
                                >
                                  <span>{reaction.emoji}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="_feed_hover_detail_wrap _feed_reaction_slot">
                            <button
                              type="button"
                              className="_feed_inner_timeline_reaction_emoji _feed_reaction"
                              onClick={() => {
                                setExpandedCommentsByPost((prev) => ({
                                  ...prev,
                                  [post._id]: true,
                                }))
                                const input = document.getElementById(`comment-input-${post._id}`) as HTMLTextAreaElement | null
                                input?.focus()
                              }}
                            >
                              <span className="_feed_inner_timeline_reaction_link">Comment</span>
                            </button>
                            <HoverDetailsCard title="Comments" total={commentCount} names={commentNames} />
                          </div>

                          <button type="button" className="_feed_inner_timeline_reaction_emoji _feed_reaction _feed_reaction_slot">
                            <span className="_feed_inner_timeline_reaction_link">Share</span>
                          </button>
                        </div>

                        <div className="_feed_inner_timeline_cooment_area _padd_r24 _padd_l24">
                          {showCommentsSection ? (
                            <>
                              <div className="_feed_inner_comment_box">
                                <form
                                  className="_feed_inner_comment_box_form"
                                  onSubmit={async (event) => {
                                    event.preventDefault()
                                    const value = commentDraft[post._id]?.trim()
                                    if (!value) {
                                      return
                                    }

                                    try {
                                      await addComment(post._id, value)
                                      await refreshPosts()
                                      setCommentDraft((prev) => ({ ...prev, [post._id]: '' }))
                                    } catch (unknownError) {
                                      const message = unknownError instanceof Error ? unknownError.message : 'Unable to comment'
                                      setError(message)
                                    }
                                  }}
                                >
                                  <div className="_feed_inner_comment_box_content">
                                    <img src="/assets/images/txt_img.png" alt="profile" className="_comment_img" />
                                    <div className="_feed_inner_comment_box_content_txt w-100">
                                      <textarea
                                        id={`comment-input-${post._id}`}
                                        className="form-control _comment_textarea"
                                        placeholder="Write a comment"
                                        value={commentDraft[post._id] ?? ''}
                                        onChange={(event) =>
                                          setCommentDraft((prev) => ({ ...prev, [post._id]: event.target.value }))
                                        }
                                      />
                                    </div>
                                  </div>
                                  <button className="_btn1" type="submit">
                                    Comment
                                  </button>
                                </form>
                              </div>

                              <div className="_mar_t16">
                                {visibleComments.map((comment) => {
                              const replyKey = `${post._id}:${comment._id}`
                              const selectedCommentReactionKey = commentReactionMap[comment._id] ?? 'LIKE'
                              const selectedCommentReaction = getReactionOption(selectedCommentReactionKey)
                              const commentReactionLabel = comment.isLiked ? selectedCommentReaction.label : 'React'
                              const commentReactionColor = comment.isLiked ? selectedCommentReaction.color : undefined
                              const commentLikeCount = comment.likedBy?.length ?? comment.likeCount ?? 0
                              const commentLikeNames = (comment.likedBy ?? []).map(
                                (reaction) => `${reaction.firstName} ${reaction.lastName}`,
                              )
                              const allReplies = comment.replies ?? []
                              const visibleReplies = allReplies

                              return (
                                <div key={comment._id} className="_comment_main _mar_b16">
                                  <div className="_comment_image">
                                    <img
                                      src={comment.author.profile ?? '/assets/images/post_img.png'}
                                      alt={`${comment.author.firstName} ${comment.author.lastName}`}
                                      className="_comment_img1"
                                    />
                                  </div>

                                  <div className="_comment_area">
                                    <div className="_comment_details">
                                      <div className="_comment_details_top">
                                        <div className="_comment_name">
                                          <h4 className="_comment_name_title">
                                            {comment.author.firstName} {comment.author.lastName}
                                          </h4>
                                        </div>
                                      </div>

                                      <p className="_comment_status_text">
                                        <span>{comment.content}</span>
                                      </p>

                                      {commentLikeCount > 0 ? (
                                        <div className="_total_reactions _feed_hover_detail_wrap">
                                          <div className="_total_react">
                                            <span>{selectedCommentReaction.emoji}</span>
                                          </div>
                                          <span className="_total">{commentLikeCount}</span>
                                          <HoverDetailsCard
                                            title="Reactions"
                                            total={commentLikeCount}
                                            names={commentLikeNames}
                                          />
                                        </div>
                                      ) : null}
                                    </div>

                                    <div className="_comment_reply_num">
                                      <ul className="_comment_reply_list list-unstyled mb-0">
                                        <li>
                                          <div className="_mini_reaction_wrap">
                                            <button
                                              className={`_btn3 _mini_reaction_btn _comment_action_btn ${comment.isLiked ? '_feed_reaction_active' : ''}`}
                                              type="button"
                                              onClick={async () => {
                                                try {
                                                  await toggleCommentLike(comment._id, comment.isLiked)
                                                  if (comment.isLiked) {
                                                    setCommentReactionMap((prev) => ({ ...prev, [comment._id]: 'LIKE' }))
                                                  } else {
                                                    setCommentReactionMap((prev) => ({
                                                      ...prev,
                                                      [comment._id]: prev[comment._id] ?? 'LIKE',
                                                    }))
                                                  }
                                                  await refreshPosts()
                                                } catch (unknownError) {
                                                  const message =
                                                    unknownError instanceof Error ? unknownError.message : 'Unable to react'
                                                  setError(message)
                                                }
                                              }}
                                              style={commentReactionColor ? { color: commentReactionColor } : undefined}
                                            >
                                              {commentReactionLabel}
                                            </button>

                                            <div className="_mini_reaction_picker">
                                              {REACTION_OPTIONS.map((reaction) => (
                                                <button
                                                  key={reaction.key}
                                                  type="button"
                                                  className="_mini_reaction_option"
                                                  onClick={async () => {
                                                    try {
                                                      if (!comment.isLiked) {
                                                        await toggleCommentLike(comment._id, comment.isLiked)
                                                      }
                                                      setCommentReactionMap((prev) => ({ ...prev, [comment._id]: reaction.key }))
                                                      await refreshPosts()
                                                    } catch (unknownError) {
                                                      const message =
                                                        unknownError instanceof Error ? unknownError.message : 'Unable to react'
                                                      setError(message)
                                                    }
                                                  }}
                                                  title={reaction.label}
                                                >
                                                  {reaction.emoji}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </li>
                                        <li>
                                          <span
                                            onClick={() => {
                                              const input = document.getElementById(`reply-input-${replyKey}`) as HTMLInputElement | null
                                              input?.focus()
                                            }}
                                          >
                                            Reply
                                          </span>
                                        </li>
                                        <li>
                                          <span className="_time_link">{formatRelativeTime(comment.createdAt)}</span>
                                        </li>
                                      </ul>
                                    </div>

                                    <div className="_mar_t16 _mar_l24">
                                      {visibleReplies.map((reply) => {
                                        const selectedReplyReactionKey = replyReactionMap[reply._id] ?? 'LIKE'
                                        const selectedReplyReaction = getReactionOption(selectedReplyReactionKey)
                                        const replyReactionLabel = reply.isLiked ? selectedReplyReaction.label : 'React'
                                        const replyReactionColor = reply.isLiked ? selectedReplyReaction.color : undefined
                                        const replyLikeCount = reply.likedBy?.length ?? reply.likeCount ?? 0
                                        const replyLikeNames = (reply.likedBy ?? []).map(
                                          (reaction) => `${reaction.firstName} ${reaction.lastName}`,
                                        )

                                        return (
                                          <div key={reply._id} className="_comment_main _comment_main_reply _mar_b12">
                                            <div className="_comment_image">
                                              <img
                                                src={reply.author.profile ?? '/assets/images/post_img.png'}
                                                alt={`${reply.author.firstName} ${reply.author.lastName}`}
                                                className="_comment_img1"
                                              />
                                            </div>

                                            <div className="_comment_area">
                                              <div className="_comment_details">
                                                <div className="_comment_details_top">
                                                  <div className="_comment_name">
                                                    <h4 className="_comment_name_title">
                                                      {reply.author.firstName} {reply.author.lastName}
                                                    </h4>
                                                  </div>
                                                </div>

                                                <p className="_comment_status_text">
                                                  <span>{reply.content}</span>
                                                </p>

                                                {replyLikeCount > 0 ? (
                                                  <div className="_total_reactions _feed_hover_detail_wrap">
                                                    <div className="_total_react">
                                                      <span>{selectedReplyReaction.emoji}</span>
                                                    </div>
                                                    <span className="_total">{replyLikeCount}</span>
                                                    <HoverDetailsCard
                                                      title="Reactions"
                                                      total={replyLikeCount}
                                                      names={replyLikeNames}
                                                    />
                                                  </div>
                                                ) : null}
                                              </div>

                                              <div className="_comment_reply_num">
                                                <ul className="_comment_reply_list list-unstyled mb-0">
                                                  <li>
                                                    <div className="_mini_reaction_wrap">
                                                      <button
                                                        className={`_btn3 _mini_reaction_btn _comment_action_btn ${reply.isLiked ? '_feed_reaction_active' : ''}`}
                                                        type="button"
                                                        onClick={async () => {
                                                          try {
                                                            await toggleReplyLike(reply._id, reply.isLiked)
                                                            if (reply.isLiked) {
                                                              setReplyReactionMap((prev) => ({ ...prev, [reply._id]: 'LIKE' }))
                                                            } else {
                                                              setReplyReactionMap((prev) => ({
                                                                ...prev,
                                                                [reply._id]: prev[reply._id] ?? 'LIKE',
                                                              }))
                                                            }
                                                            await refreshPosts()
                                                          } catch (unknownError) {
                                                            const message =
                                                              unknownError instanceof Error
                                                                ? unknownError.message
                                                                : 'Unable to react'
                                                            setError(message)
                                                          }
                                                        }}
                                                        style={replyReactionColor ? { color: replyReactionColor } : undefined}
                                                      >
                                                        {replyReactionLabel}
                                                      </button>

                                                      <div className="_mini_reaction_picker">
                                                        {REACTION_OPTIONS.map((reaction) => (
                                                          <button
                                                            key={reaction.key}
                                                            type="button"
                                                            className="_mini_reaction_option"
                                                            onClick={async () => {
                                                              try {
                                                                if (!reply.isLiked) {
                                                                  await toggleReplyLike(reply._id, reply.isLiked)
                                                                }
                                                                setReplyReactionMap((prev) => ({ ...prev, [reply._id]: reaction.key }))
                                                                await refreshPosts()
                                                              } catch (unknownError) {
                                                                const message =
                                                                  unknownError instanceof Error
                                                                    ? unknownError.message
                                                                    : 'Unable to react'
                                                                setError(message)
                                                              }
                                                            }}
                                                            title={reaction.label}
                                                          >
                                                            {reaction.emoji}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </li>
                                                  <li>
                                                    <span className="_time_link">{formatRelativeTime(reply.createdAt)}</span>
                                                  </li>
                                                </ul>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>

                                    <form
                                      className="_feed_inner_comment_box_form _comment_reply_form"
                                      onSubmit={async (event) => {
                                        event.preventDefault()
                                        const value = replyDraft[replyKey]?.trim()
                                        if (!value) {
                                          return
                                        }

                                        try {
                                          await addReply(comment._id, value)
                                          await refreshPosts()
                                          setReplyDraft((prev) => ({ ...prev, [replyKey]: '' }))
                                        } catch (unknownError) {
                                          const message = unknownError instanceof Error ? unknownError.message : 'Unable to reply'
                                          setError(message)
                                        }
                                      }}
                                    >
                                      <div className="_feed_inner_comment_box">
                                        <div className="_feed_inner_comment_box_content">
                                          <img src="/assets/images/txt_img.png" alt="profile" className="_comment_img" />
                                          <div className="_feed_inner_comment_box_content_txt w-100">
                                            <input
                                              id={`reply-input-${replyKey}`}
                                              type="text"
                                              className="form-control _comment_reply_input"
                                              placeholder="Write a comment"
                                              value={replyDraft[replyKey] ?? ''}
                                              onChange={(event) =>
                                                setReplyDraft((prev) => ({ ...prev, [replyKey]: event.target.value }))
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <button className="_btn3 _mar_t8" type="submit">
                                        Reply
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              )
                                })}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12 d-none d-lg-block">
                <div className="_sidebar_right">
                  <div className="_you_might_like _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b24">
                    <h5 className="_sidebar_title">You Might Like</h5>
                    <div className="_suggested_person_card _mar_b16">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                          <img src="/assets/images/post_img.png" alt="Person" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <p className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>Sarah Wilson</p>
                            <small className="text-muted">Design</small>
                          </div>
                        </div>
                        <button className="_btn3" style={{ padding: '4px 12px', fontSize: '12px' }}>Follow</button>
                      </div>
                    </div>
                    <div className="_suggested_person_card">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                          <img src="/assets/images/post_img.png" alt="Person" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <p className="mb-0" style={{ fontSize: '14px', fontWeight: '500' }}>Mike Brown</p>
                            <small className="text-muted">Developer</small>
                          </div>
                        </div>
                        <button className="_btn3" style={{ padding: '4px 12px', fontSize: '12px' }}>Follow</button>
                      </div>
                    </div>
                  </div>

                  <div className="_your_friends _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24">
                    <h5 className="_sidebar_title">Your Friends</h5>
                    <div className="_friend_item _mar_b12">
                      <div className="d-flex align-items-center gap-2">
                        <img src="/assets/images/post_img.png" alt="Friend" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                        <p className="mb-0" style={{ fontSize: '13px' }}>Alice Johnson</p>
                      </div>
                    </div>
                    <div className="_friend_item _mar_b12">
                      <div className="d-flex align-items-center gap-2">
                        <img src="/assets/images/post_img.png" alt="Friend" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                        <p className="mb-0" style={{ fontSize: '13px' }}>Bob Williams</p>
                      </div>
                    </div>
                    <div className="_friend_item _mar_b12">
                      <div className="d-flex align-items-center gap-2">
                        <img src="/assets/images/post_img.png" alt="Friend" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                        <p className="mb-0" style={{ fontSize: '13px' }}>Emma Davis</p>
                      </div>
                    </div>
                    <div className="_friend_item">
                      <div className="d-flex align-items-center gap-2">
                        <img src="/assets/images/post_img.png" alt="Friend" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
                        <p className="mb-0" style={{ fontSize: '13px' }}>Chris Martin</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
