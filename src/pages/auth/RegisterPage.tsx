import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function RegisterPage() {
const { registerUser, resendVerificationOtp, socialLoginUser, verifyUserEmail } = useAuth()
const navigate = useNavigate()
const googleAppId = (import.meta.env.VITE_GOOGLE_APP_ID as string | undefined) ?? ''
const socialDeviceToken = (import.meta.env.VITE_SOCIAL_DEVICE_TOKEN as string | undefined) ?? 'web'

const [form, setForm] = useState({
firstName: '',
lastName: '',
email: '',
password: '',
confirmPassword: '',
})
const [error, setError] = useState('')
const [success, setSuccess] = useState('')
const [loading, setLoading] = useState(false)
const [googleLoading, setGoogleLoading] = useState(false)
const [needsVerification, setNeedsVerification] = useState(false)
const [oneTimeCode, setOneTimeCode] = useState('')
const [resendingOtp, setResendingOtp] = useState(false)
const [acceptedTerms, setAcceptedTerms] = useState(false)

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
event.preventDefault()
setError('')
setSuccess('')

if (form.password !== form.confirmPassword) {
setError('Password and repeat password do not match')
return
}

if (!acceptedTerms) {
setError('Please agree to terms & conditions')
return
}

setLoading(true)

try {
await registerUser({
firstName: form.firstName,
lastName: form.lastName,
email: form.email,
password: form.password,
})
setNeedsVerification(true)
setSuccess('Registration successful. Please enter the verification code sent to your email.')
} catch (unknownError) {
const message = unknownError instanceof Error ? unknownError.message : 'Registration failed'
setError(message)
} finally {
setLoading(false)
}
}

const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
event.preventDefault()
setError('')
setSuccess('')

if (!oneTimeCode.trim()) {
setError('Verification code is required')
return
}

setLoading(true)
try {
await verifyUserEmail({
email: form.email,
oneTimeCode: oneTimeCode.trim(),
})
navigate(`/login?verified=1&email=${encodeURIComponent(form.email)}`)
} catch (unknownError) {
const message = unknownError instanceof Error ? unknownError.message : 'Verification failed'
setError(message)
} finally {
setLoading(false)
}
}

const handleResendOtp = async () => {
setError('')
setSuccess('')

if (!form.email.trim()) {
setError('Email is required to resend OTP')
return
}

setResendingOtp(true)
try {
await resendVerificationOtp({ email: form.email.trim() })
setSuccess('A new OTP has been sent to your email.')
} catch (unknownError) {
const message = unknownError instanceof Error ? unknownError.message : 'Failed to resend OTP'
setError(message)
} finally {
setResendingOtp(false)
}
}

const handleGoogleRegister = async () => {
setError('')
setSuccess('')

if (!acceptedTerms) {
setError('Please agree to terms & conditions')
return
}

if (!googleAppId.trim()) {
setError('Google appId is not configured. Please set VITE_GOOGLE_APP_ID in .env.')
return
}

setGoogleLoading(true)
try {
await socialLoginUser({
appId: googleAppId.trim(),
role: 'GENERAL',
deviceToken: socialDeviceToken.trim() || 'web',
})
navigate('/feed')
} catch (unknownError) {
const message = unknownError instanceof Error ? unknownError.message : 'Google registration failed'
setError(message)
} finally {
setGoogleLoading(false)
}
}

return (
<section className="_social_registration_wrapper _layout_main_wrapper">
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
<div className="_social_registration_wrap">
<div className="container">
<div className="row align-items-center">
<div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
<div className="_social_registration_right">
<div className="_social_registration_right_image">
<img src="/assets/images/registration.png" alt="Image" />
</div>
</div>
</div>
<div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
<div className="_social_registration_content">
<div className="_social_registration_right_logo _mar_b28">
<img src="/assets/images/logo.svg" alt="Image" className="_right_logo" />
</div>
<p className="_social_registration_content_para _mar_b8">Get Started Now</p>
<h4 className="_social_registration_content_title _titl4 _mar_b50">Registration</h4>
{!needsVerification ? (
<>
<button
type="button"
className="_social_registration_content_btn _w_100 _mar_b24"
onClick={handleGoogleRegister}
disabled={googleLoading || loading}
>
<img src="/assets/images/google.svg" alt="Google" className="_google_img" />
<span>{googleLoading ? 'Please wait...' : 'Register with Google'}</span>
</button>
<p className="_social_registration_content_bottom_txt _mar_b24">
<span>or</span>
</p>
</>
) : null}
<form className="_social_registration_form" onSubmit={needsVerification ? handleVerify : handleSubmit}>
<div className="row">
<div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
<div className="_social_registration_form_input _mar_b14">
<label className="_social_registration_label _mar_b8">First Name</label>
<input
type="text"
className="form-control _social_registration_input"
value={form.firstName}
onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
required
/>
</div>
</div>
<div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
<div className="_social_registration_form_input _mar_b14">
<label className="_social_registration_label _mar_b8">Last Name</label>
<input
type="text"
className="form-control _social_registration_input"
value={form.lastName}
onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
required
/>
</div>
</div>
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_registration_form_input _mar_b14">
<label className="_social_registration_label _mar_b8">Email</label>
<input
type="email"
className="form-control _social_registration_input"
value={form.email}
onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
required
/>
</div>
</div>
{!needsVerification ? (
<>
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_registration_form_input _mar_b14">
<label className="_social_registration_label _mar_b8">Password</label>
<input
type="password"
className="form-control _social_registration_input"
value={form.password}
onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
required
/>
</div>
</div>
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_registration_form_input _mar_b14">
<label className="_social_registration_label _mar_b8">Repeat Password</label>
<input
type="password"
className="form-control _social_registration_input"
value={form.confirmPassword}
onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
required
/>
</div>
</div>
</>
) : (
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_registration_form_input _mar_b14">
<label className="_social_registration_label _mar_b8">Verification Code</label>
<input
type="text"
className="form-control _social_registration_input"
value={oneTimeCode}
onChange={(event) => setOneTimeCode(event.target.value)}
required
/>
</div>
<p className="_social_registration_bottom_txt_para _mar_b14">
Didn&apos;t get OTP?{' '}
<button
type="button"
className="_social_registration_bottom_txt_para"
style={{ border: 'none', background: 'transparent', padding: 0, textDecoration: 'underline' }}
onClick={handleResendOtp}
disabled={resendingOtp || loading}
>
{resendingOtp ? 'Resending...' : 'Resend OTP'}
</button>
</p>
</div>
)}
</div>

{success ? <p className="_social_registration_bottom_txt_para _mar_b14">{success}</p> : null}
{error ? <p className="_social_registration_bottom_txt_para _mar_b14">{error}</p> : null}

{!needsVerification ? (
<div className="form-check _social_registration_form_check _mar_t8 _mar_b24">
<input
className="form-check-input _social_registration_form_check_input"
type="checkbox"
id="registerTerms"
checked={acceptedTerms}
onChange={(event) => setAcceptedTerms(event.target.checked)}
/>
<label className="form-check-label _social_registration_form_check_label" htmlFor="registerTerms">
I agree to terms &amp; conditions
</label>
</div>
) : null}

<div className="row">
<div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
<div className="_social_registration_form_btn _mar_t40 _mar_b60">
<button
type="submit"
className="_social_registration_form_btn_link _btn1"
style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
disabled={loading}
>
{loading ? 'Please wait...' : needsVerification ? 'Verify Email' : 'Create Account'}
</button>
</div>
</div>
</div>
</form>
<div className="row">
<div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
<div className="_social_registration_bottom_txt">
<p className="_social_registration_bottom_txt_para">
Already have an account? <Link to="/login">Login now</Link>
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
