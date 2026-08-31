import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from '../../components/common/Navbar'
import { PasswordField } from '../../components/auth/PasswordField'
import toast from 'react-hot-toast'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [showWrongPasswordModal, setShowWrongPasswordModal] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setShowWrongPasswordModal(false)

    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.full_name || 'User'}! Redirecting to Dashboard...`)

      setTimeout(() => {
        if (user.role === 'candidate') navigate('/candidate')
        else if (user.role === 'recruiter') navigate('/recruiter')
        else if (user.role === 'admin') navigate('/admin')
      }, 500)
    } catch (err) {
      const errorDetail = err.response?.data?.detail || 'Unable to sign in. Please check your credentials.'
      setErrorMessage(errorDetail)

      if (errorDetail.toLowerCase().includes('wrong password')) {
        setShowWrongPasswordModal(true)
        toast.error('Wrong password! Please check your password and try again.', {
          duration: 5000,
          style: {
            background: '#FEF0F0',
            color: '#D92D20',
            border: '1px solid #FECDCA',
          },
        })
      } else {
        toast.error(errorDetail)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white border border-line rounded-[10px] shadow-card overflow-hidden">

          {/* LEFT PANEL: Brand Messaging & Illustration */}
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#EAF3FF]/90 via-[#F7F9FC] to-white border-r border-[#E1E5EB] p-8 relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.svg"
                  alt="HireAI Logo"
                  className="w-11 h-auto object-contain shrink-0"
                />
                <div>
                  <p className="font-extrabold text-lg text-[#172B4D] leading-tight font-display">HireAI</p>
                  <p className="text-[11px] text-[#5E6C84]">AI-Powered Hiring &amp; Candidate Evaluation Platform</p>
                </div>
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FF] border border-[#378FE9]/30 text-[#0A66C2] text-xs font-bold shadow-xs mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#0A66C2]"></span>
                  Secure &amp; Intelligent Access
                </span>
                <h3 className="font-extrabold text-2xl text-[#172B4D] leading-snug font-display">
                  Find Your Perfect Career
                </h3>
                <p className="text-xs text-[#5E6C84] mt-2 leading-relaxed">
                  Connect your skills with top job opportunities powered by AI-driven resume
                  parsing, semantic matching, and interactive coding benchmarks.
                </p>
              </div>
            </div>

            {/* Career Scene Image */}
            <div className="my-3 rounded-2xl overflow-hidden border border-[#E1E5EB] shadow-md bg-white p-1">
              <img
                src="/images/hero-talent-collaboration.jpg"
                alt="AI Talent Collaboration & Career Platform"
                className="w-full h-44 rounded-xl object-cover"
              />
            </div>

            {/* Bottom Highlights */}
            <div className="space-y-1.5 pt-2 border-t border-[#E1E5EB] text-[11px] text-[#5E6C84]">
              <div className="flex items-center gap-2">
                <span className="text-[#057642] font-bold">✓</span>
                <span>Deterministic ATS ranking &amp; explainable scores</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#057642] font-bold">✓</span>
                <span>Containerized coding sandbox with AI hint assistance</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Login Form */}
          <div className="p-8 md:p-10 space-y-6">
            <div className="space-y-2">
              <div className="flex lg:hidden items-center justify-center mb-2">
                <img
                  src="/logo.svg"
                  alt="HireAI Logo"
                  className="w-14 h-auto object-contain"
                />
              </div>
              <h2 className="page-title">Welcome Back</h2>
              <p className="text-sm text-ink-2 mt-1">
                Access candidate analytics, recruiter job management, or system governance.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-[10px] bg-err-bg border border-err/30 text-err text-xs font-semibold p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-err hover:text-ink font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="field-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="input w-full"
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Authenticating...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="text-center text-sm text-ink-2 border-t border-line pt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand font-semibold hover:underline">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Wrong Password Modal */}
      {showWrongPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="bg-white border border-line rounded-[10px] shadow-card max-w-md w-full p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-err-bg border border-err/30 text-err flex items-center justify-center text-2xl mx-auto">
              🔒
            </div>
            <h3 className="text-lg font-bold text-ink">Wrong Password</h3>
            <p className="text-sm text-ink-2 leading-relaxed">
              The password you entered for <strong className="text-ink">{email}</strong> is incorrect.
              Please check your password and try again.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowWrongPasswordModal(false)}
                className="btn-danger px-6 py-2.5 rounded-[10px] text-sm font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
