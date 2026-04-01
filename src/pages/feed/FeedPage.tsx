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
import type { Post, Visibility } from '../../types'

function formatTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString()
}

export function FeedPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [composerText, setComposerText] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')
  const [image, setImage] = useState<File | null>(null)
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    const bootstrap = async () => {
      const feedPosts = await getFeedPosts()
      setPosts(feedPosts)
      setLoading(false)
    }

    void bootstrap()
  }, [])

  const canPost = useMemo(() => composerText.trim().length > 0, [composerText])

  const handleCreatePost = async () => {
    if (!canPost) {
      return
    }

    await createPost({
      text: composerText,
      image,
      visibility,
    })

    const refreshedPosts = await getFeedPosts()
    setPosts(refreshedPosts)
    setComposerText('')
    setImage(null)
    setVisibility('PUBLIC')
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
        <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10">
          <div className="container _custom_container">
            <div className="_logo_wrap">
              <img src="/assets/images/logo.svg" alt="Image" className="_nav_logo" />
            </div>
            <div className="ms-auto d-flex align-items-center">
              <p className="_mar_r16">{user?.firstName} {user?.lastName}</p>
              <button type="button" className="_btn1" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row justify-content-center">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
                      <div className="_feed_inner_text_area_box">
                        <div className="_feed_inner_text_area_box_image">
                          <img src="/assets/images/txt_img.png" alt="Image" className="_txt_img" />
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
                        <button type="button" className="_feed_inner_text_area_btn_link" onClick={handleCreatePost}>
                          <span>Post</span>
                        </button>
                      </div>
                    </div>

                    {posts.length === 0 ? (
                      <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16 _padd_r24 _padd_l24">
                        <p className="_feed_inner_timeline_post_box_para">
                          No posts visible yet. Create your first post above.
                        </p>
                      </div>
                    ) : null}

                    {posts.map((post) => {
                      const likedByMe = Boolean(post.likedBy.find((item) => item.userId === user?.id))

                      return (
                        <div key={post.id} className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
                          <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
                            <div className="_feed_inner_timeline_post_top">
                              <div className="_feed_inner_timeline_post_box">
                                <div className="_feed_inner_timeline_post_box_image">
                                  <img src="/assets/images/post_img.png" alt="" className="_post_img" />
                                </div>
                                <div className="_feed_inner_timeline_post_box_txt">
                                  <h4 className="_feed_inner_timeline_post_box_title">
                                    {post.author.firstName} {post.author.lastName}
                                  </h4>
                                  <p className="_feed_inner_timeline_post_box_para">
                                    {formatTime(post.createdAt)} . <a href="#0">{post.visibility}</a>
                                  </p>
                                </div>
                              </div>
                            </div>
                            <h4 className="_feed_inner_timeline_post_title">{post.text}</h4>
                            {post.imageUrl ? (
                              <div className="_feed_inner_timeline_image">
                                <img src={post.imageUrl} alt="post" className="_time_img" />
                              </div>
                            ) : null}
                          </div>

                          <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
                            <div className="_feed_inner_timeline_total_reacts_txt">
                              <p className="_feed_inner_timeline_total_reacts_para1">
                                <span>{post.comments.length}</span> Comment
                              </p>
                              <p className="_feed_inner_timeline_total_reacts_para2">
                                <span>{post.likedBy.length}</span> Likes
                              </p>
                            </div>
                          </div>

                          <div className="_feed_inner_timeline_reaction">
                            <button
                              className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${likedByMe ? '_feed_reaction_active' : ''}`}
                              onClick={async () => setPosts(await togglePostLike(post.id))}
                            >
                              <span className="_feed_inner_timeline_reaction_link">Like/Unlike</span>
                            </button>
                            <span className="_feed_inner_timeline_reaction_link">
                              Liked by: {post.likedBy.map((entry) => entry.name).join(', ') || 'No one yet'}
                            </span>
                          </div>

                          <div className="_feed_inner_timeline_cooment_area _padd_r24 _padd_l24">
                            <div className="_feed_inner_comment_box">
                              <form
                                className="_feed_inner_comment_box_form"
                                onSubmit={async (event) => {
                                  event.preventDefault()
                                  const value = commentDraft[post.id]?.trim()
                                  if (!value) {
                                    return
                                  }
                                  setPosts(await addComment(post.id, value))
                                  setCommentDraft((prev) => ({ ...prev, [post.id]: '' }))
                                }}
                              >
                                <div className="_feed_inner_comment_box_content_txt w-100">
                                  <textarea
                                    className="form-control _comment_textarea"
                                    placeholder="Write a comment"
                                    value={commentDraft[post.id] ?? ''}
                                    onChange={(event) =>
                                      setCommentDraft((prev) => ({ ...prev, [post.id]: event.target.value }))
                                    }
                                  />
                                </div>
                                <button className="_btn1" type="submit">
                                  Comment
                                </button>
                              </form>
                            </div>

                            <div className="_mar_t16">
                              {post.comments.map((comment) => {
                                const replyKey = `${post.id}:${comment.id}`
                                const commentLikedByMe = Boolean(
                                  comment.likedBy.find((item) => item.userId === user?.id),
                                )

                                return (
                                  <div key={comment.id} className="_comment_main _mar_b16">
                                    <div className="_comment_area w-100">
                                      <div className="_comment_details">
                                        <div className="_comment_name">
                                          <h4 className="_comment_name_title">
                                            {comment.user.firstName} {comment.user.lastName}
                                          </h4>
                                        </div>
                                        <div className="_comment_status">
                                          <p className="_comment_status_text">
                                            <span>{comment.text}</span>
                                          </p>
                                        </div>
                                        <div className="d-flex align-items-center gap-3 mt-2">
                                          <button
                                            className="_btn3"
                                            type="button"
                                            onClick={async () => setPosts(await toggleCommentLike(post.id, comment.id))}
                                          >
                                            {commentLikedByMe ? 'Unlike' : 'Like'}
                                          </button>
                                          <span>
                                            Liked by: {comment.likedBy.map((entry) => entry.name).join(', ') || 'No one'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="_mar_t16 _mar_l24">
                                        {comment.replies.map((reply) => {
                                          const replyLikedByMe = Boolean(
                                            reply.likedBy.find((item) => item.userId === user?.id),
                                          )

                                          return (
                                            <div key={reply.id} className="_mar_b8">
                                              <p>
                                                <strong>{reply.user.firstName}:</strong> {reply.text}
                                              </p>
                                              <div className="d-flex align-items-center gap-3">
                                                <button
                                                  className="_btn3"
                                                  type="button"
                                                  onClick={async () =>
                                                    setPosts(await toggleReplyLike(post.id, comment.id, reply.id))
                                                  }
                                                >
                                                  {replyLikedByMe ? 'Unlike' : 'Like'}
                                                </button>
                                                <span>
                                                  Liked by: {reply.likedBy.map((entry) => entry.name).join(', ') || 'No one'}
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>

                                      <form
                                        className="d-flex gap-2 _mar_t8"
                                        onSubmit={async (event) => {
                                          event.preventDefault()
                                          const value = replyDraft[replyKey]?.trim()
                                          if (!value) {
                                            return
                                          }
                                          setPosts(await addReply(post.id, comment.id, value))
                                          setReplyDraft((prev) => ({ ...prev, [replyKey]: '' }))
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
                      )
                    })}
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
