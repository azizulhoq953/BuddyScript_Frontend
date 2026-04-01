import { useEffect, useMemo, useState } from 'react'
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

function formatTime(value: string) {
  return new Date(value).toLocaleString()
}

function toNames(reactions: FeedReaction[] | undefined) {
  if (!reactions || reactions.length === 0) {
    return 'No one yet'
  }

  return reactions.map((item) => `${item.firstName} ${item.lastName}`).join(', ')
}

export function FeedPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [composerText, setComposerText] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')
  const [image, setImage] = useState<File | null>(null)
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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
      await createPost({ text: composerText.trim(), image, visibility })
      await refreshPosts()
      setComposerText('')
      setImage(null)
      setVisibility('PUBLIC')
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Post creation failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return <div className="_padd_t24 _text_center">Loading feed...</div>
  }

  if (error) {
    return <div className="_padd_t24 _text_center alert alert-danger" role="alert">
      <strong>Error:</strong> {error}
      <br />
      <button className="btn btn-sm btn-primary mt-3" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
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
                        <div className="form-floating _feed_inner_text_area_box_form">
                          <textarea
                            className="form-control _textarea"
                            placeholder="Write something ..."
                            value={composerText}
                            onChange={(event) => setComposerText(event.target.value)}
                          />
                          <label className="_feed_textarea_label">Write something ...</label>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3 gap-2 flex-wrap">
                        <div className="d-flex align-items-center gap-2">
                          <select
                            className="form-select"
                            value={visibility}
                            onChange={(event) => setVisibility(event.target.value as Visibility)}
                            style={{ width: 160 }}
                          >
                            <option value="PUBLIC">Public</option>
                            <option value="PRIVATE">Private</option>
                          </select>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                            style={{ maxWidth: 280 }}
                          />
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

                    {posts.map((post) => (
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
                                  {formatTime(post.createdAt)} · <a href="#0">{post.visibility}</a>
                                </p>
                              </div>
                            </div>
                          </div>
                          <h4 className="_feed_inner_timeline_post_title">{post.text}</h4>
                          {post.image ? (
                            <div className="_feed_inner_timeline_image">
                              <img src={post.image} alt="post" className="_time_img" />
                            </div>
                          ) : null}
                        </div>

                        <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
                          <div className="_feed_inner_timeline_total_reacts_txt">
                            <p className="_feed_inner_timeline_total_reacts_para1">
                              <span>{post.comments?.length ?? post.commentCount ?? 0}</span> Comments
                            </p>
                            <p className="_feed_inner_timeline_total_reacts_para2">
                              <span>{post.likeCount ?? post.likedBy?.length ?? 0}</span> Likes
                            </p>
                          </div>
                        </div>

                        <div className="_feed_inner_timeline_reaction">
                          <button
                            className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${post.isLiked ? '_feed_reaction_active' : ''}`}
                            onClick={async () => {
                              try {
                                await togglePostLike(post._id, post.isLiked)
                                await refreshPosts()
                              } catch (unknownError) {
                                const message = unknownError instanceof Error ? unknownError.message : 'Unable to react'
                                setError(message)
                              }
                            }}
                          >
                            <span className="_feed_inner_timeline_reaction_link">{post.isLiked ? 'Unlike' : 'Like'}</span>
                          </button>
                          <span className="_feed_inner_timeline_reaction_link">Liked by: {toNames(post.likedBy)}</span>
                        </div>

                        <div className="_feed_inner_timeline_cooment_area _padd_r24 _padd_l24">
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
                              <div className="_feed_inner_comment_box_content_txt w-100">
                                <textarea
                                  className="form-control _comment_textarea"
                                  placeholder="Write a comment"
                                  value={commentDraft[post._id] ?? ''}
                                  onChange={(event) =>
                                    setCommentDraft((prev) => ({ ...prev, [post._id]: event.target.value }))
                                  }
                                />
                              </div>
                              <button className="_btn1" type="submit">
                                Comment
                              </button>
                            </form>
                          </div>

                          <div className="_mar_t16">
                            {(post.comments ?? []).map((comment) => {
                              const replyKey = `${post._id}:${comment._id}`

                              return (
                                <div key={comment._id} className="_comment_main _mar_b16">
                                  <div className="_comment_area w-100">
                                    <div className="_comment_details">
                                      <div className="_comment_name">
                                        <h4 className="_comment_name_title">
                                          {comment.author.firstName} {comment.author.lastName}
                                        </h4>
                                      </div>
                                      <div className="_comment_status">
                                        <p className="_comment_status_text">
                                          <span>{comment.content}</span>
                                        </p>
                                      </div>
                                      <div className="d-flex align-items-center gap-3 mt-2">
                                        <button
                                          className="_btn3"
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              await toggleCommentLike(comment._id, comment.isLiked)
                                              await refreshPosts()
                                            } catch (unknownError) {
                                              const message =
                                                unknownError instanceof Error ? unknownError.message : 'Unable to react'
                                              setError(message)
                                            }
                                          }}
                                        >
                                          {comment.isLiked ? 'Unlike' : 'Like'}
                                        </button>
                                        <span>Liked by: {toNames(comment.likedBy)}</span>
                                      </div>
                                    </div>

                                    <div className="_mar_t16 _mar_l24">
                                      {(comment.replies ?? []).map((reply) => (
                                        <div key={reply._id} className="_mar_b8">
                                          <p>
                                            <strong>{reply.author.firstName}:</strong> {reply.content}
                                          </p>
                                          <div className="d-flex align-items-center gap-3">
                                            <button
                                              className="_btn3"
                                              type="button"
                                              onClick={async () => {
                                                try {
                                                  await toggleReplyLike(reply._id, reply.isLiked)
                                                  await refreshPosts()
                                                } catch (unknownError) {
                                                  const message =
                                                    unknownError instanceof Error
                                                      ? unknownError.message
                                                      : 'Unable to react'
                                                  setError(message)
                                                }
                                              }}
                                            >
                                              {reply.isLiked ? 'Unlike' : 'Like'}
                                            </button>
                                            <span>Liked by: {toNames(reply.likedBy)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <form
                                      className="d-flex gap-2 _mar_t8"
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
                                      <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Write a reply"
                                        value={replyDraft[replyKey] ?? ''}
                                        onChange={(event) =>
                                          setReplyDraft((prev) => ({ ...prev, [replyKey]: event.target.value }))
                                        }
                                      />
                                      <button className="_btn3" type="submit">
                                        Reply
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
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
