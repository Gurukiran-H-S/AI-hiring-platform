import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, api } from '../../context/AuthContext'
import { Navbar } from '../../components/common/Navbar'
import { AuthIllustration } from '../../components/auth/AuthIllustration'
import { RoleSelector } from '../../components/auth/RoleSelector'
import { PasswordField } from '../../components/auth/PasswordField'
import { OTPInputBoxes } from '../../components/auth/OTPInputBoxes'
import toast from 'react-hot-toast'

export const Register = () => {
  const [step, setStep] = useState('register') // 'register' | 'otp' | 'success'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('candidate')

  // OTP States
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorShake, setErrorShake] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSendOTP = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!fullName.trim()) return toast.error('Please enter your full name')
    if (!email.trim()) return toast.error('Please enter your email address')
    if (!password || password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    try {
      await api.post('/auth/send-otp', { email })
      toast.success(`6-Digit OTP sent to ${email}!`)
      setStep('otp')
      setOtp('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send verification OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!otp || otp.length < 6) {
      return toast.error('Please enter the complete 6-digit OTP code')
    }

    setLoading(true)
    setErrorShake(false)

    try {
      // 1. Verify OTP with backend
      await api.post('/auth/verify-otp', { email, otp })
      
      // Show Success Checkmark
      setStep('success')
      toast.success('Email Verified Successfully!')

      // 2. Register Account
      const user = await register({ full_name: fullName, email, password, role })
      
      setTimeout(() => {
        if (user.role === 'candidate') navigate('/candidate')
        else if (user.role === 'recruiter') navigate('/recruiter')
        else if (user.role === 'admin') navigate('/admin')
      }, 1200)

    } catch (err) {
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 1200)

      const detail = err.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg || item).join(' ')
        : detail || 'Incorrect OTP verification code. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white relative flex flex-col justify-between overflow-x-hidden">
      <Navbar />

      {/* Hero Ambient Background Orbs */}
      <div className="orb-primary w-[500px] h-[500px] -top-32 -left-32 opacity-40"></div>
      <div className="orb-accent w-[400px] h-[400px] bottom-0 -right-32 opacity-40"></div>

      <main className="flex-1 flex items-center justify-center px-4 py-24 z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#0d0e19]/80 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 transition-all duration-500">
          
          {/* LEFT COLUMN: Animated AI Platform Visual */}
          <AuthIllustration
            title="Join HireAI Unified Platform"
            subtitle="Build your career or hire top talent with AI-powered resume parsing, ATS scoring & automated screening."
          />

          {/* RIGHT COLUMN: Modern Glassmorphic Form */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                <span>🚀</span> Create Your Account
              </div>
              <h2 className="font-display font-bold text-3xl text-white">
                {step === 'register' ? 'Get Started Free' : step === 'otp' ? 'Email Verification' : 'Email Verified! 🎉'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {step === 'register'
                  ? 'Build your career with AI-powered candidate evaluation.'
                  : step === 'otp'
                  ? `Enter 6-Digit OTP code sent to ${email}`
                  : 'Account created successfully. Preparing your personalized dashboard...'}
              </p>
            </div>

            {/* STEP 1: Registration Form */}
            {step === 'register' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#0a0b14]/80 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full bg-[#0a0b14]/80 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <PasswordField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <RoleSelector selectedRole={role} onChange={setRole} />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all duration-300 transform hover:scale-[1.01]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Generating Code...
                    </span>
                  ) : (
                    'Send Verification OTP →'
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: 6-Digit OTP Verification Form */}
            {step === 'otp' && (
              <div className="space-y-6">
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
                  className="w-full text-xs text-slate-400 hover:text-white text-center py-1 font-semibold"
                >
                  ← Back to Details
                </button>
              </div>
            )}

            {/* STEP 3: Success Transition */}
            {step === 'success' && (
              <div className="glass-card p-8 text-center border border-emerald-500/40 rounded-2xl bg-emerald-500/10 space-y-4 animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-4xl flex items-center justify-center mx-auto animate-bounce">
                  ✓
                </div>
                <h3 className="font-bold text-xl font-display text-white">Email Verified!</h3>
                <p className="text-xs text-slate-300">
                  Account created successfully. Preparing your personalized dashboard...
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-white/5 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
                Sign In
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
