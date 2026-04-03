import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function LoginPage() {
const { loginUser } = useAuth()
const navigate = useNavigate()
const location = useLocation()

const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
const prefilledEmail = searchParams.get('email') ?? ''

const [form, setForm] = useState({ email: prefilledEmail, password: '' })
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
const authMessage =
searchParams.get('reason') === 'auth' ? 'Please login first to view the feed.' : ''
const verifiedMessage =
searchParams.get('verified') === '1' ? 'Email verified successfully. Please login.' : ''

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
event.preventDefault()
setError('')
setLoading(true)

try {
await loginUser(form)
navigate('/feed')
} catch (unknownError) {
const message = unknownError instanceof Error ? unknownError.message : 'Login failed'
setError(message)
} finally {
setLoading(false)
}
}

return (
<section className="_social_login_wrapper _layout_main_wrapper">
<div className="_shape_one">
<img src="/assets/images/shape1.svg" alt="" className="_shape_img" />
<img src="/assets/images/dark_shape.svg" alt="" className="_dark_shape" />
</div>
<div className="_shape_two">
<img src="/assets/images/shape2.svg" alt="" className="_shape_img" />
<img src="/assets/images/dark_shape1.svg" alt="" className="_dark_shape _dark_shape_opacity" />
</div>
<div className="_shape_three">
<img src="/assets/images/shape3.svg" alt="" className="_shape_img" />
<img src="/assets/images/dark_shape2.svg" alt="" className="_dark_shape _dark_shape_opacity" />
</div>
<div className="_social_login_wrap">
<div className="container">
<div className="row align-items-center">
<div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
<div className="_social_login_left">
<div className="_social_login_left_image">
<img src="/assets/images/login.png" alt="Image" className="_left_img" />
</div>
</div>
</div>
<div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
<div className="_social_login_content">
<div className="_social_login_left_logo _mar_b28">
<img src="/assets/images/logo.svg" alt="Image" className="_left_logo" />
</div>
<p className="_social_login_content_para _mar_b8">Welcome back</p>
<h4 className="_social_login_content_title _titl4 _mar_b50">Login to your account</h4>
<form className="_social_login_form" onSubmit={handleSubmit}>
<div className="row">
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_login_form_input _mar_b14">
<label className="_social_login_label _mar_b8">Email</label>
<input
type="email"
className="form-control _social_login_input"
value={form.email}
onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
required
/>
</div>
</div>
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_login_form_input _mar_b14">
<label className="_social_login_label _mar_b8">Password</label>
<input
type="password"
className="form-control _social_login_input"
value={form.password}
onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
required
/>
</div>
</div>
</div>

{authMessage ? <p className="_social_login_bottom_txt_para _mar_b14">{authMessage}</p> : null}
{verifiedMessage ? <p className="_social_login_bottom_txt_para _mar_b14">{verifiedMessage}</p> : null}
{error ? <p className="_social_login_bottom_txt_para _mar_b14">{error}</p> : null}

<div className="row">
<div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
<div className="_social_login_form_btn _mar_t40 _mar_b60">
<button type="submit" className="_social_login_form_btn_link _btn1" disabled={loading}>
{loading ? 'Logging in...' : 'Login now'}
</button>
</div>
</div>
</div>
</form>
<div className="row">
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_login_bottom_txt">
<p className="_social_login_bottom_txt_para">
Don&apos;t have an account? <Link to="/register">Create New Account</Link>
</p>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
)
}
