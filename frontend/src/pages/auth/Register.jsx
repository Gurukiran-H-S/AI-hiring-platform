import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, api } from '../../context/AuthContext'
import { OTPInputBoxes } from '../../components/auth/OTPInputBoxes'
import toast from 'react-hot-toast'

export const Register = () => {
  const [step, setStep] = useState('register') // 'register' | 'otp' | 'success'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [role, setRole] = useState('candidate') // 'candidate' | 'recruiter'
  const [organizationName, setOrganizationName] = useState('')
  const [phone, setPhone] = useState('')

  // OTP States
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorShake, setErrorShake] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  // Calculate Password Strength
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, text: '', color: 'bg-slate-200' }
    let score = 0
    if (password.length >= 8) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    if (score <= 1) return { level: 1, text: 'Weak', color: 'bg-rose-500', width: 'w-1/3' }
    if (score <= 3) return { level: 2, text: 'Medium', color: 'bg-amber-500', width: 'w-2/3' }
    return { level: 3, text: 'Strong', color: 'bg-emerald-500', width: 'w-full' }
  }, [password])

  const handleSendOTP = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!fullName.trim()) return toast.error('Please enter your full name')
    if (!email.trim()) return toast.error('Please enter a valid email address')
    if (!password || password.length < 8) return toast.error('Password must contain at least 8 characters')
    if (password !== confirmPassword) return toast.error('Passwords do not match')
    if (role === 'recruiter' && !organizationName.trim()) return toast.error('Please enter your organization name')

    setLoading(true)
    try {
      await api.post('/auth/send-otp', { email: email.trim() })
      toast.success(`Verification code sent to ${email.trim()}! Please check your inbox.`)
      setStep('otp')
      setOtp('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send verification code. Please check your email.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!otp || otp.length < 6) {
      return toast.error('Please enter the full 6-digit verification code')
    }

    setLoading(true)
    setErrorShake(false)

    try {
      // 1. Verify OTP with backend
      await api.post('/auth/verify-otp', { email: email.trim(), otp: otp.trim() })

      // Show Success Checkmark
      setStep('success')
      toast.success('Email Verified Successfully!')

      // 2. Register Account
      const user = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        organization_name: role === 'recruiter' ? organizationName.trim() : undefined,
        phone: role === 'recruiter' ? phone.trim() : undefined
      })

      setTimeout(() => {
        if (user.role === 'candidate') navigate('/candidate')
        else if (user.role === 'recruiter') navigate('/recruiter')
        else if (user.role === 'admin') navigate('/admin')
        else navigate('/')
      }, 1200)

    } catch (err) {
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 1200)

      const detail = err.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg || item).join(' ')
        : detail || 'Incorrect verification code. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172B4D] font-sans antialiased flex flex-col justify-between selection:bg-[#EAF3FF] selection:text-[#0A66C2]">
      
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-[#E1E5EB] bg-white/95 backdrop-blur-md flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center font-extrabold text-sm shadow-xs group-hover:bg-[#004182] transition-colors">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-extrabold text-lg text-[#172B4D] tracking-tight font-display">
            Hire<span className="text-[#0A66C2]">AI</span>
          </span>
        </Link>

        <div className="text-xs text-[#5E6C84]">
          Already registered?{' '}
          <Link to="/login" className="text-[#0A66C2] hover:text-[#004182] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Registration Layout (Split Screen) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl bg-white border border-[#E1E5EB] rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-3 duration-500">
          
          {/* ─── LEFT PANEL: 3D CAREER PROGRESSION ILLUSTRATION & BRAND STORY ─── */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#EAF3FF]/90 via-[#F7F9FC] to-white border-r border-[#E1E5EB] p-8 flex-col justify-between relative overflow-hidden">
            
            {/* Top Brand Header */}
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] border border-[#378FE9]/30 text-[#0A66C2] text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                Join HireAI Talent Suite
              </span>
              <h2 className="text-2xl font-extrabold text-[#172B4D] tracking-tight font-display leading-snug">
                Where Human Talent Meets The Right Opportunity.
              </h2>
              <p className="text-xs text-[#5E6C84] leading-relaxed">
                Connect your engineering skills directly to verified recruiter opportunities with explainable ATS scoring and containerized coding benchmarks.
              </p>
            </div>

            {/* 3D Career Scene Illustration */}
            <div className="my-4 rounded-2xl overflow-hidden border border-[#E1E5EB] shadow-md bg-white p-1">
              <img
                src="/images/register-career-scene.jpg"
                alt="Candidate Creating Profile & Career Journey"
                className="w-full h-auto rounded-xl object-cover"
              />
            </div>

            {/* Bottom Benefits */}
            <div className="space-y-1.5 pt-3 border-t border-[#E1E5EB] text-[11px] text-[#5E6C84]">
              <div className="flex items-center gap-2">
                <span className="text-[#057642] font-bold">✓</span>
                <span>Free to get started · No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#057642] font-bold">✓</span>
                <span>Objective, explainable AI evaluations</span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL: REGISTRATION FORM & OTP ─── */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Form Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight font-display">
                {step === 'register' ? 'Create your account' : step === 'otp' ? 'Verify your email' : 'Account Created!'}
              </h1>
              <p className="text-xs sm:text-sm text-[#5E6C84] mt-1">
                {step === 'register'
                  ? 'Join HireAI to accelerate your career or hire top engineering talent.'
                  : step === 'otp'
                  ? `Enter the 6-digit verification code sent to ${email}`
                  : 'Welcome to HireAI. Your personalized dashboard is ready.'}
              </p>
            </div>

            {/* ─── STEP 1: REGISTRATION FORM ─── */}
            {step === 'register' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                
                {/* Role Selector Tabs */}
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1.5 uppercase tracking-wider">
                    I want to join as:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        role === 'candidate'
                          ? 'bg-[#EAF3FF] border-[#0A66C2] text-[#0A66C2] shadow-xs'
                          : 'bg-white border-[#E1E5EB] text-[#5E6C84] hover:bg-[#F7F9FC]'
                      }`}
                    >
                      <span>👨‍💻</span> Candidate / Job Seeker
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('recruiter')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        role === 'recruiter'
                          ? 'bg-[#EAF3FF] border-[#0A66C2] text-[#0A66C2] shadow-xs'
                          : 'bg-white border-[#E1E5EB] text-[#5E6C84] hover:bg-[#F7F9FC]'
                      }`}
                    >
                      <span>👩‍💼</span> Recruiter / Hiring Manager
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E1E5EB] text-sm text-[#172B4D] placeholder:text-[#5E6C84]/60 focus:outline-none focus:border-[#0A66C2] focus:ring-3 focus:ring-[#0A66C2]/10 transition-all"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-[#172B4D] mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E1E5EB] text-sm text-[#172B4D] placeholder:text-[#5E6C84]/60 focus:outline-none focus:border-[#0A66C2] focus:ring-3 focus:ring-[#0A66C2]/10 transition-all"
                  />
                </div>

                {/* Password & Strength Indicator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#172B4D]">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    {password && (
                      <span className={`text-[10px] font-bold ${
                        passwordStrength.level === 3 ? 'text-emerald-600' :
                        passwordStrength.level === 2 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        Strength: {passwordStrength.text}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-[#E1E5EB] text-sm text-[#172B4D] placeholder:text-[#5E6C84]/60 focus:outline-none focus:border-[#0A66C2] focus:ring-3 focus:ring-[#0A66C2]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E6C84] hover:text-[#172B4D] text-xs font-semibold"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {/* Password Strength Bar */}
                  {password && (
                    <div className="w-full bg-[#F7F9FC] h-1.5 rounded-full overflow-hidden border border-[#E1E5EB] mt-1.5">
                      <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300`} />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#172B4D]">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    {confirmPassword && (
                      <span className={`text-[10px] font-bold ${
                        password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-[#E1E5EB] text-sm text-[#172B4D] placeholder:text-[#5E6C84]/60 focus:outline-none focus:border-[#0A66C2] focus:ring-3 focus:ring-[#0A66C2]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5E6C84] hover:text-[#172B4D] text-xs font-semibold"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Recruiter Specific Fields */}
                {role === 'recruiter' && (
                  <div className="space-y-4 pt-2 border-t border-[#E1E5EB]">
                    <div>
                      <label className="block text-xs font-bold text-[#172B4D] mb-1">
                        Organization / Company Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="e.g. Acme Innovations"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E1E5EB] text-sm text-[#172B4D] placeholder:text-[#5E6C84]/60 focus:outline-none focus:border-[#0A66C2] focus:ring-3 focus:ring-[#0A66C2]/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172B4D] mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E1E5EB] text-sm text-[#172B4D] placeholder:text-[#5E6C84]/60 focus:outline-none focus:border-[#0A66C2] focus:ring-3 focus:ring-[#0A66C2]/10 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Sending Code...</span>
                    </span>
                  ) : (
                    <span>Continue to Verification →</span>
                  )}
                </button>

              </form>
            )}

            {/* ─── STEP 2: OTP VERIFICATION ─── */}
            {step === 'otp' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <OTPInputBoxes
                  value={otp}
                  onChange={setOtp}
                  onVerify={handleVerifyAndRegister}
                  onResend={handleSendOTP}
                  loading={loading}
                  errorShake={errorShake}
                />

                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="w-full py-2.5 rounded-xl bg-[#F7F9FC] hover:bg-slate-100 border border-[#E1E5EB] text-xs font-bold text-[#5E6C84] hover:text-[#172B4D] transition-colors"
                >
                  ← Edit Account Details
                </button>
              </div>
            )}

            {/* ─── STEP 3: SUCCESS STATE ─── */}
            {step === 'success' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-4 animate-in zoom-in-95 duration-400">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white text-3xl flex items-center justify-center mx-auto shadow-md">
                  ✓
                </div>
                <h3 className="text-xl font-extrabold text-[#172B4D] font-display">Account Created!</h3>
                <p className="text-xs text-[#5E6C84] leading-relaxed max-w-sm mx-auto">
                  Welcome to HireAI. Your account is verified and ready. Redirecting to your dashboard...
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[#057642]">
                    <span className="w-3.5 h-3.5 border-2 border-[#057642] border-t-transparent rounded-full animate-spin"></span>
                    <span>Opening Dashboard...</span>
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Link */}
            <div className="pt-6 border-t border-[#E1E5EB] text-center text-xs text-[#5E6C84] mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0A66C2] hover:text-[#004182] font-bold hover:underline">
                Sign In
              </Link>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-[11px] text-[#5E6C84] border-t border-[#E1E5EB] bg-white">
        © 2026 HireAI Platform · Human Talent + Technology
      </footer>

    </div>
  )
}
